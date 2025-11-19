/**
 * 智能预取管理器
 *
 * 功能：管理预取队列、网络状态监测、预取策略、预测性预取
 * 使用示例参考：docs/tanstack-query-usage.md - 4. 预取 Hooks
 */

import type { QueryClient, QueryFunction, QueryKey } from "@tanstack/react-query";
import { DEFAULT_STALE_TIME } from "../core/config";
import { getNetworkInfo, getNetworkSpeed } from "./network";

/**
 * Network Information API 类型定义
 */
interface NetworkInformation extends EventTarget {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

/**
 * 预取配置
 */
export interface PrefetchConfig {
  priority?: "high" | "medium" | "low"; // 预取优先级
  delay?: number; // 预取延迟（毫秒）
  staleTime?: number; // 数据过期时间
  allowSlowNetwork?: boolean; // 是否在慢速网络下预取
}

export interface PrefetchTask {
  queryKey: QueryKey;
  queryFn: QueryFunction<any>;
  config: PrefetchConfig;
  timestamp: number;
  /** 任务ID */
  id: string;
  /** 预测分数（用于预测性预取） */
  predictionScore?: number;
}

export type NetworkSpeed = "slow" | "medium" | "fast" | "unknown";

/** 预取统计信息 */
export interface PrefetchStats {
  /** 队列大小 */
  queueSize: number;
  /** 历史记录大小 */
  historySize: number;
  /** 当前网络速度 */
  networkSpeed: NetworkSpeed;
  /** 是否正在处理 */
  isProcessing: boolean;
  /** 总预取次数 */
  totalPrefetches: number;
  /** 成功预取次数 */
  successfulPrefetches: number;
  /** 失败预取次数 */
  failedPrefetches: number;
  /** 平均预取时间（毫秒） */
  averagePrefetchTime: number;
  /** 跳过的预取次数（由于网络或其他原因） */
  skippedPrefetches: number;
}

/** 用户交互记录 */
export interface InteractionRecord {
  /** 查询键 */
  queryKey: QueryKey;
  /** 访问时间戳 */
  timestamp: number;
  /** 访问类型 */
  type: "view" | "hover" | "click" | "focus";
}

/** 预测结果 */
export interface PredictionResult {
  /** 查询键 */
  queryKey: QueryKey;
  /** 预测分数（0-1） */
  score: number;
  /** 预测原因 */
  reason: string;
}

// ==================== 智能预取管理器 ====================

export class SmartPrefetchManager {
  private queryClient: QueryClient;
  private prefetchQueue: Map<string, PrefetchTask> = new Map();
  private prefetchHistory: Set<string> = new Set();
  private networkSpeed: NetworkSpeed = "fast";
  private isProcessing = false;
  private maxQueueSize = 10;
  private maxHistorySize = 100;

  // 性能监控统计
  private totalPrefetches = 0;
  private successfulPrefetches = 0;
  private failedPrefetches = 0;
  private skippedPrefetches = 0;
  private prefetchTimes: number[] = [];
  private maxPrefetchTimesSize = 50;

  // 预测性预取
  private interactionHistory: InteractionRecord[] = [];
  private maxInteractionHistorySize = 100;
  private queryAccessCounts: Map<string, number> = new Map();
  private querySequences: Array<{ from: string; to: string; count: number }> = [];
  private maxSequenceSize = 50;

  // ✅ 清理函数：用于移除网络监听器
  private networkCleanup?: () => void;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.initNetworkMonitoring();
  }

  // ==================== 网络监测 ====================

  /**
   * 初始化网络状态监测
   */
  private initNetworkMonitoring() {
    const networkInfo = getNetworkInfo();
    if (!networkInfo) {
      return;
    }

    // 初始化网络速度
    this.updateNetworkSpeed();

    // 监听网络变化
    if (typeof navigator !== "undefined" && "connection" in navigator) {
      const navWithConnection = navigator as NavigatorWithConnection;
      const connection =
        navWithConnection.connection || navWithConnection.mozConnection || navWithConnection.webkitConnection;

      const handleNetworkChange = () => {
        this.updateNetworkSpeed();
      };

      connection?.addEventListener?.("change", handleNetworkChange);

      // ✅ 保存清理函数
      this.networkCleanup = () => {
        connection?.removeEventListener("change", handleNetworkChange);
      };
    }
  }

  /**
   * 更新网络速度状态
   */
  private updateNetworkSpeed() {
    this.networkSpeed = getNetworkSpeed();
  }

  /**
   * 获取当前网络速度
   */
  public getNetworkSpeed(): NetworkSpeed {
    return this.networkSpeed;
  }

  /**
   * 检查是否为慢速网络
   */
  public isSlowNetwork(): boolean {
    return this.networkSpeed === "slow" || this.networkSpeed === "unknown";
  }

  // ==================== 预取决策 ====================

  /**
   * 判断是否应该预取
   */
  public shouldPrefetch(queryKey: QueryKey, config: PrefetchConfig = {}): boolean {
    const key = this.getQueryKeyString(queryKey);

    // 检查是否已在队列中
    if (this.prefetchQueue.has(key)) {
      return false;
    }

    // 检查是否已预取过
    if (this.prefetchHistory.has(key)) {
      return false;
    }

    // 检查缓存中是否已有数据
    const cachedData = this.queryClient.getQueryData(queryKey);
    if (cachedData) {
      return false;
    }

    // 检查网络状态
    if (this.isSlowNetwork() && !config.allowSlowNetwork) {
      return false;
    }

    // 检查队列大小
    if (this.prefetchQueue.size >= this.maxQueueSize) {
      return false;
    }

    return true;
  }

  // ==================== 预取操作 ====================

  /**
   * 添加预取任务到队列
   */
  public addPrefetchTask(queryKey: QueryKey, queryFn: QueryFunction<any>, config: PrefetchConfig = {}): boolean {
    if (!this.shouldPrefetch(queryKey, config)) {
      this.skippedPrefetches++;
      return false;
    }

    const key = this.getQueryKeyString(queryKey);
    const task: PrefetchTask = {
      id: `${key}-${Date.now()}`,
      queryKey,
      queryFn,
      config: {
        priority: "medium",
        delay: 0,
        staleTime: DEFAULT_STALE_TIME,
        allowSlowNetwork: false,
        ...config
      },
      timestamp: Date.now()
    };

    this.prefetchQueue.set(key, task);
    this.processQueue();

    return true;
  }

  /**
   * 处理预取队列
   */
  private async processQueue() {
    if (this.isProcessing || this.prefetchQueue.size === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // 按优先级排序任务
      const sortedTasks = this.getSortedTasks();

      for (const task of sortedTasks) {
        const key = this.getQueryKeyString(task.queryKey);
        const startTime = Date.now();

        // 延迟执行
        if (task.config.delay && task.config.delay > 0) {
          await this.delay(task.config.delay);
        }

        // 执行预取
        try {
          this.totalPrefetches++;

          await this.queryClient.prefetchQuery({
            queryKey: task.queryKey,
            queryFn: task.queryFn,
            staleTime: task.config.staleTime
          });

          // 记录成功
          this.successfulPrefetches++;
          const duration = Date.now() - startTime;
          this.recordPrefetchTime(duration);

          // 记录到历史
          this.addToHistory(key);
        } catch (error) {
          this.failedPrefetches++;
          console.warn(`Prefetch failed for ${key}:`, error);
        }

        // 从队列中移除
        this.prefetchQueue.delete(key);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 获取排序后的任务列表（优先级队列）
   */
  private getSortedTasks(): PrefetchTask[] {
    const tasks = Array.from(this.prefetchQueue.values());

    const priorityOrder = { high: 0, medium: 1, low: 2 };

    return tasks.sort((a, b) => {
      // 首先按优先级排序
      const priorityA = priorityOrder[a.config.priority || "medium"];
      const priorityB = priorityOrder[b.config.priority || "medium"];

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // 如果有预测分数，按分数排序
      if (a.predictionScore !== undefined && b.predictionScore !== undefined) {
        if (a.predictionScore !== b.predictionScore) {
          return b.predictionScore - a.predictionScore; // 分数高的优先
        }
      }

      // 最后按时间戳排序（先进先出）
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * 立即执行预取（跳过队列）
   */
  public async prefetchNow<TData = unknown>(
    queryKey: QueryKey,
    queryFn: QueryFunction<TData>,
    config: PrefetchConfig = {}
  ): Promise<void> {
    const key = this.getQueryKeyString(queryKey);
    const startTime = Date.now();

    try {
      this.totalPrefetches++;

      await this.queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: config.staleTime || DEFAULT_STALE_TIME
      });

      this.successfulPrefetches++;
      const duration = Date.now() - startTime;
      this.recordPrefetchTime(duration);

      this.addToHistory(key);
    } catch (error) {
      this.failedPrefetches++;
      console.warn(`Immediate prefetch failed for ${key}:`, error);
      throw error;
    }
  }

  // ==================== 历史管理 ====================

  /**
   * 添加到预取历史
   */
  private addToHistory(key: string) {
    this.prefetchHistory.add(key);

    // 限制历史记录大小
    if (this.prefetchHistory.size > this.maxHistorySize) {
      const firstKey = this.prefetchHistory.values().next().value as string | undefined;
      if (firstKey) {
        this.prefetchHistory.delete(firstKey);
      }
    }
  }

  /**
   * 清除预取历史
   */
  public clearHistory() {
    this.prefetchHistory.clear();
  }

  /**
   * 清除预取队列
   */
  public clearQueue() {
    this.prefetchQueue.clear();
  }

  /**
   * 重置管理器
   */
  public reset(): void {
    this.clearQueue();
    this.clearHistory();
    this.clearInteractionHistory();
    this.resetStats();
  }

  /**
   * ✅ 销毁管理器并清理所有资源
   */
  public destroy(): void {
    // 清理网络监听器
    if (this.networkCleanup) {
      this.networkCleanup();
      this.networkCleanup = undefined;
    }

    // 清理所有数据
    this.reset();
  }

  // ==================== 预测性预取 ====================

  /**
   * 记录用户交互
   */
  public recordInteraction(queryKey: QueryKey, type: "view" | "hover" | "click" | "focus" = "view"): void {
    const interaction: InteractionRecord = {
      queryKey,
      timestamp: Date.now(),
      type
    };

    this.interactionHistory.push(interaction);

    // 限制历史记录大小
    if (this.interactionHistory.length > this.maxInteractionHistorySize) {
      this.interactionHistory.shift();
    }

    // 更新访问计数
    const key = this.getQueryKeyString(queryKey);
    this.queryAccessCounts.set(key, (this.queryAccessCounts.get(key) || 0) + 1);

    // 记录查询序列（用于预测下一个可能的查询）
    if (this.interactionHistory.length >= 2) {
      const prevInteraction = this.interactionHistory[this.interactionHistory.length - 2];
      const prevKey = this.getQueryKeyString(prevInteraction.queryKey);

      const existingSequence = this.querySequences.find((s) => s.from === prevKey && s.to === key);

      if (existingSequence) {
        existingSequence.count++;
      } else {
        this.querySequences.push({ from: prevKey, to: key, count: 1 });

        // 限制序列大小
        if (this.querySequences.length > this.maxSequenceSize) {
          this.querySequences.shift();
        }
      }
    }
  }

  /**
   * 获取预测结果
   */
  public getPredictions(currentQueryKey?: QueryKey, limit = 5): PredictionResult[] {
    const predictions: PredictionResult[] = [];

    if (currentQueryKey) {
      // 基于序列的预测
      const currentKey = this.getQueryKeyString(currentQueryKey);
      const sequences = this.querySequences
        .filter((s) => s.from === currentKey)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      sequences.forEach((seq) => {
        try {
          const queryKey = JSON.parse(seq.to);
          predictions.push({
            queryKey,
            score: Math.min(seq.count / 10, 1), // 归一化到 0-1
            reason: `Frequently accessed after current query (${seq.count} times)`
          });
        } catch {
          // 忽略无效的 JSON
        }
      });
    }

    // 基于频率的预测
    const frequentQueries = Array.from(this.queryAccessCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    frequentQueries.forEach(([key, count]) => {
      try {
        const queryKey = JSON.parse(key);

        // 避免重复
        if (!predictions.some((p) => this.getQueryKeyString(p.queryKey) === key)) {
          predictions.push({
            queryKey,
            score: Math.min(count / 20, 1), // 归一化到 0-1
            reason: `Frequently accessed (${count} times)`
          });
        }
      } catch {
        // 忽略无效的 JSON
      }
    });

    // 基于时间的预测（最近访问的）
    const recentInteractions = this.interactionHistory.slice(-10).reverse();

    recentInteractions.forEach((interaction, index) => {
      const key = this.getQueryKeyString(interaction.queryKey);

      // 避免重复
      if (!predictions.some((p) => this.getQueryKeyString(p.queryKey) === key)) {
        predictions.push({
          queryKey: interaction.queryKey,
          score: Math.max(0.3 - index * 0.03, 0.1), // 越近的分数越高
          reason: `Recently accessed (${index + 1} queries ago)`
        });
      }
    });

    // 按分数排序并限制数量
    return predictions.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * 预取预测的查询
   */
  public async prefetchPredicted(
    currentQueryKey: QueryKey | undefined,
    queryFnMap: Map<string, QueryFunction<any>>,
    config: PrefetchConfig = {}
  ): Promise<void> {
    const predictions = this.getPredictions(currentQueryKey);

    for (const prediction of predictions) {
      const key = this.getQueryKeyString(prediction.queryKey);
      const queryFn = queryFnMap.get(key);

      if (queryFn) {
        // 添加预测分数到任务
        const taskConfig = {
          ...config,
          priority: prediction.score > 0.7 ? "high" : prediction.score > 0.4 ? "medium" : "low"
        } as PrefetchConfig;

        const added = this.addPrefetchTask(prediction.queryKey, queryFn, taskConfig);

        if (added) {
          // 更新任务的预测分数
          const task = this.prefetchQueue.get(key);
          if (task) {
            task.predictionScore = prediction.score;
          }
        }
      }
    }
  }

  /**
   * 清除交互历史
   */
  public clearInteractionHistory(): void {
    this.interactionHistory = [];
    this.queryAccessCounts.clear();
    this.querySequences = [];
  }

  // ==================== 性能监控 ====================

  /**
   * 记录预取时间
   */
  private recordPrefetchTime(duration: number): void {
    this.prefetchTimes.push(duration);

    // 限制记录大小
    if (this.prefetchTimes.length > this.maxPrefetchTimesSize) {
      this.prefetchTimes.shift();
    }
  }

  /**
   * 获取平均预取时间
   */
  private getAveragePrefetchTime(): number {
    if (this.prefetchTimes.length === 0) {
      return 0;
    }

    const sum = this.prefetchTimes.reduce((acc, time) => acc + time, 0);
    return Math.round(sum / this.prefetchTimes.length);
  }

  /**
   * 获取统计信息
   */
  public getStats(): PrefetchStats {
    return {
      queueSize: this.prefetchQueue.size,
      historySize: this.prefetchHistory.size,
      networkSpeed: this.networkSpeed,
      isProcessing: this.isProcessing,
      totalPrefetches: this.totalPrefetches,
      successfulPrefetches: this.successfulPrefetches,
      failedPrefetches: this.failedPrefetches,
      averagePrefetchTime: this.getAveragePrefetchTime(),
      skippedPrefetches: this.skippedPrefetches
    };
  }

  /**
   * 获取详细的性能报告
   */
  public getPerformanceReport(): {
    stats: PrefetchStats;
    successRate: number;
    predictions: {
      totalInteractions: number;
      uniqueQueries: number;
      sequencePatterns: number;
    };
    queue: {
      size: number;
      byPriority: { high: number; medium: number; low: number };
    };
  } {
    const stats = this.getStats();
    const successRate =
      stats.totalPrefetches > 0 ? Math.round((stats.successfulPrefetches / stats.totalPrefetches) * 100) : 0;

    const queueTasks = Array.from(this.prefetchQueue.values());
    const byPriority = {
      high: queueTasks.filter((t) => t.config.priority === "high").length,
      medium: queueTasks.filter((t) => t.config.priority === "medium").length,
      low: queueTasks.filter((t) => t.config.priority === "low").length
    };

    return {
      stats,
      successRate,
      predictions: {
        totalInteractions: this.interactionHistory.length,
        uniqueQueries: this.queryAccessCounts.size,
        sequencePatterns: this.querySequences.length
      },
      queue: {
        size: this.prefetchQueue.size,
        byPriority
      }
    };
  }

  /**
   * 重置性能统计
   */
  public resetStats(): void {
    this.totalPrefetches = 0;
    this.successfulPrefetches = 0;
    this.failedPrefetches = 0;
    this.skippedPrefetches = 0;
    this.prefetchTimes = [];
  }

  // ==================== 工具方法 ====================

  /**
   * 将 QueryKey 转换为字符串
   */
  private getQueryKeyString(queryKey: QueryKey): string {
    return JSON.stringify(queryKey);
  }

  /**
   * 延迟执行
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 设置最大队列大小
   */
  public setMaxQueueSize(size: number): void {
    this.maxQueueSize = size;
  }

  /**
   * 设置最大历史记录大小
   */
  public setMaxHistorySize(size: number): void {
    this.maxHistorySize = size;
  }

  /**
   * 获取队列中的任务列表
   */
  public getQueuedTasks(): PrefetchTask[] {
    return Array.from(this.prefetchQueue.values());
  }

  /**
   * 移除特定的预取任务
   */
  public removeTask(queryKey: QueryKey): boolean {
    const key = this.getQueryKeyString(queryKey);
    return this.prefetchQueue.delete(key);
  }

  /**
   * 检查任务是否在队列中
   */
  public hasTask(queryKey: QueryKey): boolean {
    const key = this.getQueryKeyString(queryKey);
    return this.prefetchQueue.has(key);
  }

  /**
   * 更新任务优先级
   */
  public updateTaskPriority(queryKey: QueryKey, priority: "high" | "medium" | "low"): boolean {
    const key = this.getQueryKeyString(queryKey);
    const task = this.prefetchQueue.get(key);

    if (task) {
      task.config.priority = priority;
      return true;
    }

    return false;
  }

  /**
   * 暂停队列处理
   */
  public pauseQueue(): void {
    this.isProcessing = true;
  }

  /**
   * 恢复队列处理
   */
  public resumeQueue(): void {
    this.isProcessing = false;
    this.processQueue();
  }
}

// ==================== 单例实例 ====================

let prefetchManagerInstance: SmartPrefetchManager | null = null;

/**
 * 获取预取管理器实例
 */
export function getPrefetchManager(queryClient: QueryClient): SmartPrefetchManager {
  if (!prefetchManagerInstance) {
    prefetchManagerInstance = new SmartPrefetchManager(queryClient);
  }
  return prefetchManagerInstance;
}

/**
 * 重置预取管理器实例
 */
export function resetPrefetchManager() {
  prefetchManagerInstance = null;
}
