/**
 * 离线功能类型定义
 *
 * 功能：定义离线恢复、离线队列、网络状态管理等类型
 */

import type { QueryKey } from "@tanstack/react-query";
import type { NetworkStatus, OperationResult } from "./base";

/**
 * 离线恢复配置
 */
export interface OfflineRecoveryConfig {
  enabled: boolean; // 是否启用离线恢复
  retryInterval: number; // 重试间隔（毫秒）
  maxRetries: number; // 最大重试次数
  retryDelay: number; // 重试延迟（毫秒）
  customRetryDelay?: (attempt: number) => number; // 自定义重试延迟函数
  networkCheckInterval: number; // 网络检查间隔（毫秒）
  retryOnReconnect: boolean; // 重连时是否重试
  refetchOnWindowFocus: boolean; // 窗口获得焦点时是否重新获取
  queryFilter?: (queryKey: QueryKey) => boolean; // 查询过滤器
  checkInterval?: number; // 检查间隔（兼容旧版本）
  refetchOnReconnect?: boolean; // 重连时是否重新获取（兼容旧版本）
}

/**
 * 离线查询信息
 */
export interface OfflineQueryInfo {
  queryKey: QueryKey; // 查询键
  queryFn: () => Promise<unknown>; // 查询函数
  failedAt: Date; // 失败时间
  retryCount: number; // 重试次数
  lastError?: Error; // 最后错误
  isPaused: boolean; // 是否暂停
  metadata?: Record<string, unknown>; // 元数据
}

/**
 * 变更操作类型枚举
 */
export enum MutationOperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  PATCH = "patch",
  CUSTOM = "custom"
}

/**
 * 离线变更操作
 */
export interface OfflineMutationOperation {
  id: string; // 操作 ID
  type: MutationOperationType; // 操作类型
  mutationKey: QueryKey; // 变更键
  mutationFn: () => Promise<unknown>; // 变更函数
  variables: unknown; // 变更变量
  createdAt: Date; // 创建时间
  retryCount: number; // 重试次数
  lastError?: Error; // 最后错误
  priority: number; // 优先级
  dependsOn?: string[]; // 依赖的操作 ID
  metadata?: Record<string, unknown>; // 元数据
}

/**
 * 离线队列配置
 */
export interface OfflineQueueConfig {
  enabled: boolean; // 是否启用队列
  maxSize: number; // 最大队列大小
  persist: boolean; // 是否持久化队列
  storageKey: string; // 存储键
  autoExecuteInterval: number; // 自动执行间隔（毫秒）
  executeOnReconnect: boolean; // 网络恢复时是否自动执行
  operationTimeout: number; // 操作超时时间（毫秒）
  concurrency: number; // 并发执行数量
}

/**
 * 变更函数注册表
 */
export interface MutationFunctionRegistry {
  register: (key: string, fn: () => Promise<unknown>) => void; // 注册变更函数
  get: (key: string) => (() => Promise<unknown>) | undefined; // 获取变更函数
  unregister: (key: string) => void; // 注销变更函数
  clear: () => void; // 清空注册表
  getKeys: () => string[]; // 获取所有已注册的键
}

/**
 * 离线管理器配置
 */
export interface OfflineManagerConfig {
  networkCheck: {
    // 网络状态检查配置
    interval: number; // 检查间隔（毫秒）
    url?: string; // 检查 URL
    timeout: number; // 超时时间（毫秒）
  };
  queue: OfflineQueueConfig; // 队列配置
  recovery: OfflineRecoveryConfig; // 恢复配置
  callbacks?: {
    // 事件回调
    onNetworkChange?: (status: NetworkStatus) => void;
    onQueueOperation?: (operation: OfflineMutationOperation, result: OperationResult) => void;
    onRecoveryComplete?: (recoveredCount: number) => void;
  };
}

/**
 * 离线状态
 */
export interface OfflineState {
  isOffline: boolean; // 是否离线
  networkStatus: NetworkStatus; // 网络状态
  queuedOperations: number; // 队列中的操作数量
  failedQueries: number; // 失败的查询数量
  lastSyncAt?: Date; // 最后同步时间
  isRecovering: boolean; // 是否正在恢复
}

/**
 * 离线查询 Hook 选项
 */
export interface OfflineQueryOptions {
  enabled?: boolean; // 是否启用离线支持
  fallbackData?: unknown; // 离线时的回退数据
  showStaleWhileOffline?: boolean; // 离线时是否显示陈旧数据
  onReconnect?: "refetch" | "keep" | "invalidate"; // 重连时的行为
}

/**
 * 离线变更 Hook 选项
 */
export interface OfflineMutationOptions {
  enableQueue?: boolean; // 是否启用离线队列
  priority?: number; // 操作优先级
  dependsOn?: string[]; // 依赖的操作
  optimisticUpdate?: (variables: unknown) => void; // 离线时的乐观更新
  rollback?: (variables: unknown) => void; // 操作失败时的回滚
}
