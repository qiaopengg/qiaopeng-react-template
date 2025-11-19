/**
 * 离线功能
 * 提供离线状态管理、离线队列、自动重试等功能
 */

import type { QueryClient } from "@tanstack/react-query";
import type {
  MutationFunctionRegistry,
  OfflineMutationOperation,
  OfflineQueueConfig,
  OfflineState
} from "../types/offline";
import { onlineManager } from "@tanstack/react-query";
import { ConnectionQuality, StorageType } from "../types/base";
import { isStorageAvailable } from "../utils/storage";

/**
 * 配置在线状态管理器
 * 监听浏览器 online/offline 事件
 */
export function setupOnlineManager() {
  if (typeof window === "undefined") return;

  onlineManager.setEventListener((setOnline) => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  });
}

/**
 * 获取当前在线状态
 * @returns {boolean} 是否在线
 */
export const isOnline = () => onlineManager.isOnline();

/**
 * 订阅在线状态变化
 *
 * @param {(online: boolean) => void} callback - 状态变化回调函数
 * @returns {() => void} 取消订阅函数
 */
export function subscribeToOnlineStatus(callback: (online: boolean) => void) {
  return onlineManager.subscribe(callback);
}

/**
 * 配置离线查询行为
 * TanStack Query 已自动处理离线状态
 *
 * @param {QueryClient} _queryClient - QueryClient 实例
 */
export function configureOfflineQueries(_queryClient: QueryClient) {
  // 简化实现，让开发者在查询级别配置
  // TanStack Query 已自动处理离线状态
}

// ==================== 离线队列管理器 ====================

/** 默认离线队列配置 */
const DEFAULT_QUEUE_CONFIG: OfflineQueueConfig = {
  enabled: true,
  maxSize: 100,
  persist: true,
  storageKey: "tanstack-query-offline-queue",
  autoExecuteInterval: 5000,
  executeOnReconnect: true,
  operationTimeout: 30000,
  concurrency: 3
};

/**
 * 计算指数退避延迟
 * 带随机抖动避免雷鸣群效应
 *
 * @param {number} attempt - 尝试次数
 * @param {number} [baseDelay] - 基础延迟（毫秒）
 * @param {number} [maxDelay] - 最大延迟（毫秒）
 * @returns {number} 延迟时间（毫秒）
 */
export function calculateExponentialBackoff(attempt: number, baseDelay = 1000, maxDelay = 30000): number {
  const delay = Math.min(baseDelay * 2 ** attempt, maxDelay);
  // 添加随机抖动以避免雷鸣群效应
  const jitter = Math.random() * 0.3 * delay;
  return Math.floor(delay + jitter);
}

/**
 * 变更函数注册表实现
 * 管理 mutation 函数的注册和获取
 */
class MutationRegistry implements MutationFunctionRegistry {
  private registry = new Map<string, () => Promise<unknown>>();

  register(key: string, fn: () => Promise<unknown>): void {
    this.registry.set(key, fn);
  }

  get(key: string): (() => Promise<unknown>) | undefined {
    return this.registry.get(key);
  }

  unregister(key: string): void {
    this.registry.delete(key);
  }

  clear(): void {
    this.registry.clear();
  }

  getKeys(): string[] {
    return Array.from(this.registry.keys());
  }
}

/** 全局变更函数注册表 */
export const mutationRegistry = new MutationRegistry();

/**
 * 离线队列管理器
 * 管理离线时的 mutation 操作队列，支持优先级、依赖关系、自动重试
 */
export class OfflineQueueManager {
  private queue: OfflineMutationOperation[] = [];
  private config: OfflineQueueConfig;
  private isExecuting = false;
  private executionTimer: NodeJS.Timeout | null = null;
  private unsubscribeOnline: (() => void) | null = null;
  private executingOperations = new Set<string>();

  constructor(config: Partial<OfflineQueueConfig> = {}) {
    this.config = { ...DEFAULT_QUEUE_CONFIG, ...config };

    if (this.config.persist) {
      this.loadQueue();
    }

    if (this.config.executeOnReconnect) {
      this.setupOnlineListener();
    }

    if (this.config.autoExecuteInterval > 0) {
      this.startAutoExecution();
    }
  }

  /**
   * 添加操作到队列
   * 按优先级插入
   *
   * @param {Omit<OfflineMutationOperation, "id" | "createdAt" | "retryCount">} operation - 操作对象
   * @returns {Promise<string>} 操作 ID
   */
  async add(operation: Omit<OfflineMutationOperation, "id" | "createdAt" | "retryCount">): Promise<string> {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newOperation: OfflineMutationOperation = {
      ...operation,
      id,
      createdAt: new Date(),
      retryCount: 0
    };

    // 检查队列大小限制
    if (this.queue.length >= this.config.maxSize) {
      throw new Error(`Queue is full (max size: ${this.config.maxSize})`);
    }

    // 按优先级插入
    const insertIndex = this.queue.findIndex((op) => op.priority < newOperation.priority);
    if (insertIndex === -1) {
      this.queue.push(newOperation);
    } else {
      this.queue.splice(insertIndex, 0, newOperation);
    }

    if (this.config.persist) {
      await this.persistQueue();
    }

    return id;
  }

  /**
   * 移除操作
   *
   * @param {string} operationId - 操作 ID
   * @returns {Promise<boolean>} 是否成功移除
   */
  async remove(operationId: string): Promise<boolean> {
    const index = this.queue.findIndex((op) => op.id === operationId);
    if (index === -1) return false;

    this.queue.splice(index, 1);

    if (this.config.persist) {
      await this.persistQueue();
    }

    return true;
  }

  /**
   * 获取队列状态
   * 返回离线状态、队列长度、失败数等信息
   *
   * @returns {OfflineState} 离线状态对象
   */
  getState(): OfflineState {
    const online = isOnline();
    return {
      isOffline: !online,
      networkStatus: {
        isOnline: online,
        isOffline: !online,
        connectionQuality: ConnectionQuality.UNKNOWN
      },
      queuedOperations: this.queue.length,
      failedQueries: this.queue.filter((op) => op.lastError).length,
      lastSyncAt: this.queue.length === 0 ? new Date() : undefined,
      isRecovering: this.isExecuting
    };
  }

  /**
   * 获取队列中的所有操作
   *
   * @returns {OfflineMutationOperation[]} 操作数组
   */
  getOperations(): OfflineMutationOperation[] {
    return [...this.queue];
  }

  /**
   * 清空队列
   * 移除所有待执行的操作
   */
  async clear(): Promise<void> {
    this.queue = [];
    if (this.config.persist) {
      await this.persistQueue();
    }
  }

  /**
   * 执行队列中的操作
   * 按依赖关系和优先级并发执行
   *
   * @returns {Promise<{ success: number, failed: number, skipped: number }>} 执行结果统计
   */
  async execute(): Promise<{ success: number; failed: number; skipped: number }> {
    if (this.isExecuting) {
      return { success: 0, failed: 0, skipped: this.queue.length };
    }

    if (!isOnline()) {
      return { success: 0, failed: 0, skipped: this.queue.length };
    }

    this.isExecuting = true;
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    try {
      // 按依赖关系和优先级排序
      const sortedOperations = this.sortOperationsByDependency();

      // 并发执行操作
      const batches = this.createBatches(sortedOperations, this.config.concurrency);

      for (const batch of batches) {
        const results = await Promise.allSettled(batch.map((op) => this.executeOperation(op)));

        results.forEach((result) => {
          if (result.status === "fulfilled") {
            if (result.value) {
              successCount++;
            } else {
              skippedCount++;
            }
          } else {
            failedCount++;
          }
        });
      }

      // 移除成功的操作
      this.queue = this.queue.filter((op) => op.lastError !== undefined);

      if (this.config.persist) {
        await this.persistQueue();
      }

      return { success: successCount, failed: failedCount, skipped: skippedCount };
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * 执行单个操作
   * 检查依赖、执行 mutation、处理超时和重试
   *
   * @param {OfflineMutationOperation} operation - 操作对象
   * @returns {Promise<boolean>} 是否执行成功
   */
  private async executeOperation(operation: OfflineMutationOperation): Promise<boolean> {
    // 检查是否已在执行
    if (this.executingOperations.has(operation.id)) {
      return false;
    }

    // 检查依赖是否满足
    if (operation.dependsOn && operation.dependsOn.length > 0) {
      const dependenciesMet = operation.dependsOn.every((depId) => !this.queue.find((op) => op.id === depId));
      if (!dependenciesMet) {
        return false; // 跳过，等待依赖完成
      }
    }

    this.executingOperations.add(operation.id);

    try {
      // 从注册表获取变更函数
      const mutationKey = Array.isArray(operation.mutationKey)
        ? operation.mutationKey.join("-")
        : String(operation.mutationKey);

      const mutationFn = mutationRegistry.get(mutationKey) || operation.mutationFn;

      // 执行操作，带超时
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Operation timeout")), this.config.operationTimeout);
      });

      await Promise.race([mutationFn(), timeoutPromise]);

      // 成功，从队列移除
      await this.remove(operation.id);
      return true;
    } catch (error) {
      // 失败，更新重试信息
      operation.retryCount++;
      operation.lastError = error instanceof Error ? error : new Error(String(error));

      // 如果重试次数过多，可以考虑移除或标记
      if (operation.retryCount >= 5) {
        console.error(`Operation ${operation.id} failed after ${operation.retryCount} retries`, error);
        // 可选：移除失败次数过多的操作
        // await this.remove(operation.id);
      }

      if (this.config.persist) {
        await this.persistQueue();
      }

      return false;
    } finally {
      this.executingOperations.delete(operation.id);
    }
  }

  /**
   * 按依赖关系排序操作
   * 使用拓扑排序确保依赖先执行
   *
   * @returns {OfflineMutationOperation[]} 排序后的操作数组
   */
  private sortOperationsByDependency(): OfflineMutationOperation[] {
    const sorted: OfflineMutationOperation[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (operation: OfflineMutationOperation) => {
      if (visited.has(operation.id)) return;
      if (visiting.has(operation.id)) {
        console.warn(`Circular dependency detected for operation ${operation.id}`);
        return;
      }

      visiting.add(operation.id);

      // 先访问依赖
      if (operation.dependsOn) {
        for (const depId of operation.dependsOn) {
          const dep = this.queue.find((op) => op.id === depId);
          if (dep) {
            visit(dep);
          }
        }
      }

      visiting.delete(operation.id);
      visited.add(operation.id);
      sorted.push(operation);
    };

    // 按优先级排序后访问
    const prioritySorted = [...this.queue].sort((a, b) => b.priority - a.priority);
    for (const operation of prioritySorted) {
      visit(operation);
    }

    return sorted;
  }

  /**
   * 创建批次
   * 将操作分组以支持并发执行
   *
   * @param {OfflineMutationOperation[]} operations - 操作数组
   * @param {number} batchSize - 批次大小
   * @returns {OfflineMutationOperation[][]} 批次数组
   */
  private createBatches(operations: OfflineMutationOperation[], batchSize: number): OfflineMutationOperation[][] {
    const batches: OfflineMutationOperation[][] = [];
    for (let i = 0; i < operations.length; i += batchSize) {
      batches.push(operations.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * 持久化队列
   * 保存队列到 localStorage
   */
  private async persistQueue(): Promise<void> {
    if (!isStorageAvailable(StorageType.LOCAL)) {
      console.warn("localStorage not available, cannot persist queue");
      return;
    }

    try {
      const serialized = JSON.stringify(
        this.queue.map((op) => ({
          ...op,
          createdAt: op.createdAt.toISOString(),
          // 不序列化函数，需要通过注册表恢复
          mutationFn: undefined
        }))
      );

      localStorage.setItem(this.config.storageKey, serialized);
    } catch (error) {
      console.error("Failed to persist queue:", error);

      // 处理存储配额超出
      if (error instanceof Error && error.name === "QuotaExceededError") {
        // 尝试清理旧数据
        this.cleanupOldOperations();
        // 重试一次
        try {
          const serialized = JSON.stringify(
            this.queue.map((op) => ({
              ...op,
              createdAt: op.createdAt.toISOString(),
              mutationFn: undefined
            }))
          );
          localStorage.setItem(this.config.storageKey, serialized);
        } catch {
          console.error("Failed to persist queue after cleanup");
        }
      }
    }
  }

  /**
   * 加载队列
   * 从 localStorage 恢复队列
   */
  private loadQueue(): void {
    if (!isStorageAvailable(StorageType.LOCAL)) {
      return;
    }

    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (!stored) return;

      const parsed = JSON.parse(stored);

      // 类型验证
      if (!Array.isArray(parsed)) {
        console.warn("[Offline] Invalid queue data format, expected array");
        this.queue = [];
        return;
      }

      this.queue = parsed.map((op: unknown) => {
        const operation = op as Record<string, unknown>;
        return {
          ...operation,
          createdAt: new Date(operation.createdAt as string),
          // 从注册表恢复变更函数
          mutationFn: operation.mutationFn || (() => Promise.reject(new Error("Mutation function not registered")))
        } as OfflineMutationOperation;
      });
    } catch (error) {
      console.error("Failed to load queue:", error);
      this.queue = [];
    }
  }

  /**
   * 清理旧操作
   * 移除超过 24 小时的操作
   */
  private cleanupOldOperations(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.queue = this.queue.filter((op) => op.createdAt > oneDayAgo);
  }

  /**
   * 设置在线监听器
   * 网络恢复时自动执行队列
   */
  private setupOnlineListener(): void {
    this.unsubscribeOnline = subscribeToOnlineStatus((online) => {
      if (online && this.queue.length > 0) {
        // 网络恢复时自动执行队列
        this.execute().catch((error) => {
          console.error("Failed to execute queue on reconnect:", error);
        });
      }
    });
  }

  /**
   * 启动自动执行
   * 定时检查并执行队列
   */
  private startAutoExecution(): void {
    this.executionTimer = setInterval(() => {
      if (isOnline() && this.queue.length > 0 && !this.isExecuting) {
        this.execute().catch((error) => {
          console.error("Failed to auto-execute queue:", error);
        });
      }
    }, this.config.autoExecuteInterval);
  }

  /**
   * 停止自动执行
   * 清除定时器
   */
  private stopAutoExecution(): void {
    if (this.executionTimer) {
      clearInterval(this.executionTimer);
      this.executionTimer = null;
    }
  }

  /**
   * 销毁管理器
   * 清理所有资源和监听器
   */
  destroy(): void {
    this.stopAutoExecution();
    if (this.unsubscribeOnline) {
      this.unsubscribeOnline();
      this.unsubscribeOnline = null;
    }
    this.executingOperations.clear();
  }
}

/**
 * 创建离线队列管理器
 *
 * @param {Partial<OfflineQueueConfig>} [config] - 队列配置
 * @returns {OfflineQueueManager} 离线队列管理器实例
 */
export function createOfflineQueueManager(config?: Partial<OfflineQueueConfig>): OfflineQueueManager {
  return new OfflineQueueManager(config);
}
