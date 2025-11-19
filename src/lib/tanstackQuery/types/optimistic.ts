/**
 * 乐观更新类型定义
 * 定义乐观更新相关的类型和接口
 *
 * @see {@link ../../../docs/tanstack-query-usage.md} 使用示例
 */

import type { QueryKey } from "@tanstack/react-query";
import type { EntityWithId } from "./selectors";

/**
 * 乐观更新配置
 * @template TData - 数据类型
 * @template TVariables - 变量类型
 * @property {QueryKey} queryKey - 查询键
 * @property {Function} updater - 数据更新器
 * @property {Function} [rollback] - 错误回滚函数
 * @property {boolean} [enabled] - 是否启用乐观更新
 */
export interface OptimisticUpdateConfig<TData = unknown, TVariables = unknown> {
  queryKey: QueryKey; // 查询键
  updater: (oldData: TData | undefined, variables: TVariables) => TData | undefined; // 数据更新器
  rollback?: (previousData: TData, error: Error) => void; // 错误回滚函数
  enabled?: boolean; // 是否启用乐观更新
}

/**
 * 乐观更新上下文
 * @template TData - 数据类型
 */
export interface OptimisticContext<TData = unknown> {
  previousData?: TData; // 之前的数据快照
  timestamp: number; // 更新时间戳
  operationType: OptimisticOperationTypeValue; // 操作类型
}

/**
 * 乐观更新操作类型常量
 */
export const OptimisticOperationType = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  BATCH: "batch"
} as const;

export type OptimisticOperationTypeValue = (typeof OptimisticOperationType)[keyof typeof OptimisticOperationType];

/**
 * 列表操作配置
 * @template T - 实体类型
 */
export interface ListOperationConfig<T extends EntityWithId> {
  queryKey: QueryKey; // 查询键
  operation: ListOperationType; // 操作类型
  onRollback?: (error: Error, context: OptimisticContext<T[]>) => void; // 错误回滚回调
}

/**
 * 列表操作类型枚举
 */
export enum ListOperationType {
  ADD = "add",
  UPDATE = "update",
  REMOVE = "remove"
}

/**
 * 批量查询结果
 * @template TData - 数据类型
 * @template TError - 错误类型
 */
export interface BatchQueryResult<TData = unknown, TError = Error> {
  data: TData | undefined; // 查询数据
  isLoading: boolean; // 是否加载中
  isError: boolean; // 是否错误
  error: TError | null; // 错误信息
  status: "pending" | "error" | "success"; // 查询状态
}

// EnhancedMutationOptions 已废弃，请使用 MutationOptions（从 types/index.ts 导入）

/**
 * 乐观更新器函数类型
 */
export type OptimisticUpdater<TData = unknown, TVariables = unknown> = (
  oldData: TData | undefined,
  variables: TVariables
) => TData;

/**
 * 回滚函数类型
 */
export type RollbackFunction<TData = unknown> = (previousData: TData, error: Error) => void;

/**
 * 列表更新器函数类型
 */
export type ListUpdater<T extends EntityWithId> = {
  add: (items: T[] | undefined, newItem: T) => T[];
  update: (items: T[] | undefined, updatedItem: Partial<T> & { id: T["id"] }) => T[];
  remove: (items: T[] | undefined, itemId: T["id"]) => T[];
};

/**
 * 乐观更新全局配置
 */
export interface OptimisticGlobalConfig {
  enabledByDefault: boolean; // 默认启用乐观更新
  defaultRollbackDelay: number; // 默认回滚延迟（毫秒）
  debugMode: boolean; // 是否启用调试模式
  maxRetries: number; // 最大重试次数
}

/**
 * 批量查询统计信息
 * 使用示例参考：docs/tanstack-query-usage.md - 3.1 批量查询统计
 */
export interface BatchQueryStats {
  total: number; // 总查询数
  loading: number; // 加载中的查询数
  success: number; // 成功的查询数
  error: number; // 错误的查询数
  stale: number; // 过期的查询数
  successRate: number; // 成功率
  errorRate: number; // 错误率
}

/**
 * 批量查询配置
 * 使用示例参考：docs/tanstack-query-usage.md - 3.2 增强版 useQueries
 */
export interface BatchQueryConfig<TData = unknown, TError = Error> {
  enableStats?: boolean; // 是否启用统计信息
  enableBatchOperations?: boolean; // 是否启用批量操作
  autoRefreshInterval?: number; // 自动刷新间隔（毫秒）
  onBatchSuccess?: (results: TData[]) => void; // 批量成功回调
  onBatchError?: (errors: TError[]) => void; // 批量错误回调
  onBatchSettled?: (results: TData[], errors: TError[]) => void; // 批量完成回调
  retryConfig?: BatchRetryConfig; // 批量操作重试配置
  enablePartialSuccess?: boolean; // 是否启用部分成功处理
  onPartialSuccess?: (report: BatchOperationReport<TData, TError>) => void; // 部分成功回调
}

/**
 * 批量操作重试配置
 */
export interface BatchRetryConfig {
  maxRetries?: number; // 最大重试次数
  retryDelay?: number | ((attemptIndex: number) => number); // 重试延迟（毫秒）或延迟函数
  retryOnlyFailed?: boolean; // 是否只重试失败的操作
  shouldRetry?: (error: Error, attemptCount: number) => boolean; // 重试条件函数
}

/**
 * 批量操作报告
 */
export interface BatchOperationReport<TData = unknown, TError = Error> {
  total: number; // 总操作数
  successful: number; // 成功的操作数
  failed: number; // 失败的操作数
  successResults: Array<{ index: number; data: TData }>; // 成功的结果
  failureErrors: Array<{ index: number; error: TError; queryKey?: unknown[] }>; // 失败的错误
  isPartialSuccess: boolean; // 是否部分成功
  isFullSuccess: boolean; // 是否完全成功
  isFullFailure: boolean; // 是否完全失败
  duration: number; // 操作耗时（毫秒）
  retryCount?: number; // 重试次数
}

/**
 * 批量操作错误聚合
 */
export interface BatchErrorAggregate<TError = Error> {
  totalErrors: number; // 错误总数
  errors: Array<{ index: number; error: TError; queryKey?: unknown[] }>; // 错误列表
  errorsByType: Map<string, TError[]>; // 错误类型分组
  firstError: TError | null; // 第一个错误
  lastError: TError | null; // 最后一个错误
  errorSummary: string; // 错误消息摘要
}

/**
 * 批量查询操作
 * 使用示例参考：docs/tanstack-query-usage.md - 3.2 增强版 useQueries
 */
export interface BatchQueryOperations {
  refetchAll: () => Promise<PromiseSettledResult<unknown>[]>; // 批量刷新所有查询
  invalidateAll: () => Promise<PromiseSettledResult<void>[]>; // 批量使所有查询失效
  cancelAll: () => Promise<PromiseSettledResult<void>[]>; // 批量取消所有查询
  resetAll: () => Promise<PromiseSettledResult<void>[]>; // 批量重置所有查询
  removeAll: () => void; // 批量移除所有查询
  retryFailed: () => Promise<BatchOperationReport>; // 重试失败的查询
  getErrorAggregate: () => BatchErrorAggregate; // 获取错误聚合信息
  getOperationReport: () => BatchOperationReport; // 获取操作报告
}

/**
 * 批量查询结果
 */
export interface EnhancedBatchQueryResult<TData = unknown, TCombinedResult = TData, TError = Error> {
  data: TCombinedResult; // 查询结果数据
  stats: BatchQueryStats; // 统计信息
  operations: BatchQueryOperations; // 批量操作
  config: BatchQueryConfig<TData, TError>; // 配置信息
}
