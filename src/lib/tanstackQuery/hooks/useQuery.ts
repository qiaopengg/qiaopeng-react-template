/**
 * 增强的 Query Hooks 模块
 * 提供带默认配置的 useQuery Hook 和 skipToken 用于类型安全的条件查询
 */

import type { QueryKey, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import { skipToken, useQuery } from "@tanstack/react-query";

/**
 * 增强的 useQuery Hook
 * 依赖全局配置提供默认值，用户可通过 options 覆盖
 *
 * @template TQueryFnData - 查询函数返回的数据类型
 * @template TError - 错误类型
 * @template TData - 最终返回的数据类型
 * @template TQueryKey - 查询键类型
 * @param {UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>} options - 查询选项
 * @returns {UseQueryResult<TData, TError>} 查询结果
 */
export function useEnhancedQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>): UseQueryResult<TData, TError> {
  // 直接使用 useQuery，依赖 QueryClient 的 defaultOptions
  return useQuery(options);
}

/**
 * skipToken - 类型安全的条件查询（TanStack Query v5 推荐方式）
 * 提供完全的类型安全，无需类型断言，当条件不满足时跳过查询执行
 *
 * @see {@link ../../../docs/tanstack-query-usage.md} 使用示例
 */
export { skipToken };
