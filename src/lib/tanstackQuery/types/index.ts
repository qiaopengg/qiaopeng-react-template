/**
 * 类型定义统一导出
 * 统一导出所有类型定义，避免循环依赖
 */

import type { QueryKey, UseMutationOptions } from "@tanstack/react-query";

export * from "./base"; // 基础类型
export * from "./infinite"; // 无限查询类型
export * from "./offline"; // 离线功能类型
export * from "./optimistic"; // 乐观更新类型
export * from "./persistence"; // 持久化类型
export * from "./selectors"; // 选择器类型
export * from "./suspense"; // Suspense 类型

/**
 * Mutation Context 类型
 * 存储 mutation 执行过程中的状态
 *
 * @template TData - 数据类型
 * @template TContext - 用户自定义的 context 类型
 * @property {TData} [previousData] - 乐观更新前的数据快照（用于回滚）
 * @property {TContext} [userContext] - 用户自定义的 context
 * @property {boolean} [conditionMet] - 是否满足条件（用于条件乐观更新）
 */
export interface MutationContext<TData = unknown, TContext = unknown> {
  previousData?: TData;
  userContext?: TContext;
  conditionMet?: boolean;
}

/**
 * 统一的 Mutation 选项接口
 * 扩展官方 UseMutationOptions，添加乐观更新支持
 *
 * @template TData - 返回数据类型
 * @template TError - 错误类型
 * @template TVariables - 变量类型
 * @template TContext - 上下文类型
 */
export interface MutationOptions<TData, TError, TVariables, TContext = unknown>
  extends UseMutationOptions<TData, TError, TVariables, TContext> {
  /**
   * 乐观更新配置（可选）
   * mutation 会在请求发送前立即更新缓存，失败则自动回滚
   *
   * @property {QueryKey} queryKey - 要更新的查询键
   * @property {Function} updater - 数据更新函数
   * @property {boolean} [enabled=true] - 是否启用乐观更新
   * @property {Record<string, string>} [fieldMapping] - 字段映射配置，只用于乐观更新显示，不影响 API 请求
   * @property {Function} [rollback] - 自定义回滚逻辑
   */
  optimistic?: {
    queryKey: QueryKey;
    updater: <TQueryData = unknown>(oldData: TQueryData | undefined, variables: TVariables) => TQueryData | undefined;
    enabled?: boolean;
    fieldMapping?: Record<string, string>;
    rollback?: <TQueryData = unknown>(previousData: TQueryData, error: Error) => void;
  };
}
