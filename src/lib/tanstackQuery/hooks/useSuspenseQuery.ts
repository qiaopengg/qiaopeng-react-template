/**
 * Suspense 查询 Hook 模块
 * 提供与 React 18 Suspense 集成的查询功能，自动处理加载状态
 */

import type {
  QueryFunction,
  QueryFunctionContext,
  QueryKey,
  UseSuspenseInfiniteQueryOptions,
  UseSuspenseInfiniteQueryResult,
  UseSuspenseQueryOptions,
  UseSuspenseQueryResult
} from "@tanstack/react-query";
import { useSuspenseInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";

/** 无限查询函数类型定义 */
type InfiniteQueryFunction<TQueryFnData = unknown, TQueryKey extends QueryKey = QueryKey, TPageParam = unknown> = (
  context: QueryFunctionContext<TQueryKey, TPageParam>
) => Promise<TQueryFnData>;

/**
 * 创建 Suspense 查询 Hook 工厂函数
 * 创建可复用的 Suspense 查询 Hook，确保类型安全
 *
 * @template TQueryFnData - 查询函数返回的数据类型
 * @template TError - 错误类型
 * @template TData - 最终返回的数据类型
 * @template TQueryKey - 查询键类型
 * @template TVariables - 变量类型
 * @param {(variables: TVariables) => TQueryKey} getQueryKey - 查询键生成函数
 * @param {QueryFunction<TQueryFnData, TQueryKey>} queryFn - 查询函数
 * @param {object} [options] - 查询选项
 * @returns {(variables: TVariables) => UseSuspenseQueryResult<TData, TError>} 返回一个可以接收变量的 Hook 函数
 */
export function createSuspenseQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TVariables = void
>(
  getQueryKey: (variables: TVariables) => TQueryKey,
  queryFn: QueryFunction<TQueryFnData, TQueryKey>,
  options?: Omit<UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, "queryKey" | "queryFn">
) {
  return (variables: TVariables): UseSuspenseQueryResult<TData, TError> => {
    // 使用用户提供的函数生成查询键
    const queryKey = getQueryKey(variables);

    return useSuspenseQuery({
      queryKey,
      queryFn,
      ...options
    });
  };
}

/**
 * 创建 Suspense 无限查询 Hook 工厂函数 - 创建可复用的 Suspense 无限查询 Hook,自动处理分页逻辑
 * @template TQueryFnData - 查询函数返回的数据类型
 * @template TError - 错误类型
 * @template TData - 最终返回的数据类型
 * @template TQueryKey - 查询键类型
 * @template TPageParam - 页面参数类型
 * @template TVariables - 变量类型
 * @param getQueryKey - 查询键生成函数
 * @param queryFn - 无限查询函数
 * @param options - 查询选项(必须包含 getNextPageParam 和 initialPageParam)
 * @returns 返回一个可以接收变量的 Hook 函数
 */
export function createSuspenseInfiniteQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TVariables = void
>(
  getQueryKey: (variables: TVariables) => TQueryKey,
  queryFn: InfiniteQueryFunction<TQueryFnData, TQueryKey, TPageParam>,
  options: Omit<
    UseSuspenseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
    "queryKey" | "queryFn"
  > & {
    getNextPageParam: (
      lastPage: TQueryFnData,
      allPages: TQueryFnData[],
      lastPageParam: TPageParam,
      allPageParams: TPageParam[]
    ) => TPageParam | undefined | null;
    initialPageParam: TPageParam;
  }
) {
  return (variables: TVariables): UseSuspenseInfiniteQueryResult<TData, TError> => {
    // 使用用户提供的函数生成查询键
    const queryKey = getQueryKey(variables);

    return useSuspenseInfiniteQuery({
      queryKey,
      queryFn,
      ...options
    });
  };
}

/**
 * 增强的 useSuspenseQuery Hook - 依赖全局配置提供默认值,自动触发 Suspense 边界
 * @template TQueryFnData - 查询函数返回的数据类型
 * @template TError - 错误类型
 * @template TData - 最终返回的数据类型
 * @template TQueryKey - 查询键类型
 * @param options - Suspense 查询选项
 * @returns Suspense 查询结果
 */
export function useEnhancedSuspenseQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(options: UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>): UseSuspenseQueryResult<TData, TError> {
  // 直接使用 useSuspenseQuery，依赖 QueryClient 的 defaultOptions
  return useSuspenseQuery(options);
}

/**
 * 增强的 useSuspenseInfiniteQuery Hook - 依赖全局配置提供默认值,自动触发 Suspense 边界
 * @template TQueryFnData - 查询函数返回的数据类型
 * @template TError - 错误类型
 * @template TData - 最终返回的数据类型
 * @template TQueryKey - 查询键类型
 * @template TPageParam - 页面参数类型
 * @param options - Suspense 无限查询选项
 * @returns Suspense 无限查询结果
 */
export function useEnhancedSuspenseInfiniteQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown
>(
  options: UseSuspenseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>
): UseSuspenseInfiniteQueryResult<TData, TError> {
  // 直接使用 useSuspenseInfiniteQuery，依赖 QueryClient 的 defaultOptions
  return useSuspenseInfiniteQuery(options);
}
