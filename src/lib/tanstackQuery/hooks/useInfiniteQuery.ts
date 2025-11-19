/**
 * Infinite Query 增强功能模块
 * 提供无限滚动查询的增强功能，支持游标分页、偏移量分页、页码分页
 */

import type { QueryFunction, QueryKey, UseInfiniteQueryOptions, UseInfiniteQueryResult } from "@tanstack/react-query";
import type { CursorPaginatedResponse, OffsetPaginatedResponse, PageNumberPaginatedResponse } from "../types/infinite";
import { infiniteQueryOptions, useInfiniteQuery } from "@tanstack/react-query";

/**
 * 增强的 Infinite Query Hook
 * 依赖全局配置提供默认值，支持自动加载下一页
 *
 * @template TQueryFnData - 查询函数返回的数据类型
 * @template TError - 错误类型
 * @template TData - 最终返回的数据类型
 * @template TQueryKey - 查询键类型
 * @template TPageParam - 页面参数类型
 * @param {UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>} options - 无限查询选项
 * @returns {UseInfiniteQueryResult<TData, TError>} 无限查询结果
 */
export function useEnhancedInfiniteQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown
>(
  options: UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>
): UseInfiniteQueryResult<TData, TError> {
  // 直接使用 useInfiniteQuery，依赖 QueryClient 的 defaultOptions
  return useInfiniteQuery(options);
}

/**
 * 创建 Infinite Query 配置工厂函数
 * 创建无限查询配置对象，依赖全局配置提供默认值
 *
 * @template TQueryFnData - 查询函数返回的数据类型
 * @template TQueryKey - 查询键类型
 * @template TPageParam - 页面参数类型
 * @param {object} config - 配置对象
 * @param {TQueryKey} config.queryKey - 查询键
 * @param {QueryFunction<TQueryFnData, TQueryKey, TPageParam>} config.queryFn - 查询函数
 * @param {TPageParam} config.initialPageParam - 初始页面参数
 * @param {Function} config.getNextPageParam - 获取下一页参数的函数
 * @param {Function} [config.getPreviousPageParam] - 获取上一页参数的函数
 * @param {number} [config.staleTime] - 数据过期时间
 * @param {number} [config.gcTime] - 垃圾回收时间
 * @returns {object} 无限查询配置
 */
export function createInfiniteQueryOptions<
  TQueryFnData = unknown,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown
>(config: {
  queryKey: TQueryKey;
  queryFn: QueryFunction<TQueryFnData, TQueryKey, TPageParam>;
  initialPageParam: TPageParam;
  getNextPageParam: (
    lastPage: TQueryFnData,
    allPages: TQueryFnData[],
    lastPageParam: TPageParam,
    allPageParams: TPageParam[]
  ) => TPageParam | undefined | null;
  getPreviousPageParam?: (
    firstPage: TQueryFnData,
    allPages: TQueryFnData[],
    firstPageParam: TPageParam,
    allPageParams: TPageParam[]
  ) => TPageParam | undefined | null;
  staleTime?: number;
  gcTime?: number;
}) {
  // 直接返回配置，依赖 QueryClient 的 defaultOptions
  return infiniteQueryOptions(config);
}

/**
 * 游标分页配置工厂
 * 创建基于游标的无限查询配置，自动处理游标传递和下一页判断
 *
 * @template T - 数据项类型
 * @param {object} config - 配置对象
 * @param {QueryKey} config.queryKey - 查询键
 * @param {(cursor: string | null) => Promise<CursorPaginatedResponse<T>>} config.queryFn - 查询函数
 * @param {string | null} [config.initialCursor] - 初始游标
 * @param {number} [config.staleTime] - 数据过期时间
 * @param {number} [config.gcTime] - 垃圾回收时间
 * @returns {object} 无限查询配置
 */
export function createCursorPaginationOptions<T>(config: {
  queryKey: QueryKey;
  queryFn: (cursor: string | null) => Promise<CursorPaginatedResponse<T>>;
  initialCursor?: string | null;
  staleTime?: number;
  gcTime?: number;
}) {
  return createInfiniteQueryOptions({
    queryKey: config.queryKey,
    queryFn: ({ pageParam }) => config.queryFn(pageParam as string | null),
    initialPageParam: config.initialCursor ?? null,
    getNextPageParam: (lastPage) => lastPage.cursor ?? null,
    getPreviousPageParam: () => null,
    staleTime: config.staleTime,
    gcTime: config.gcTime
  });
}

/**
 * 偏移量分页配置工厂
 * 创建基于偏移量的无限查询配置，自动计算偏移量和判断是否有更多数据
 *
 * @template T - 数据项类型
 * @param {object} config - 配置对象
 * @param {QueryKey} config.queryKey - 查询键
 * @param {(offset: number, limit: number) => Promise<OffsetPaginatedResponse<T>>} config.queryFn - 查询函数
 * @param {number} [config.limit] - 每页数量限制
 * @param {number} [config.staleTime] - 数据过期时间
 * @param {number} [config.gcTime] - 垃圾回收时间
 * @returns {object} 无限查询配置
 */
export function createOffsetPaginationOptions<T>(config: {
  queryKey: QueryKey;
  queryFn: (offset: number, limit: number) => Promise<OffsetPaginatedResponse<T>>;
  limit?: number;
  staleTime?: number;
  gcTime?: number;
}) {
  const limit = config.limit ?? 20;

  return createInfiniteQueryOptions({
    queryKey: [...config.queryKey, limit],
    queryFn: ({ pageParam }) => config.queryFn(pageParam as number, limit),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // 如果有 hasMore 字段，优先使用
      if (lastPage.hasMore === false) return undefined;

      // 否则根据 total 判断
      const currentOffset = allPages.length * limit;
      if (currentOffset >= lastPage.total) return undefined;

      return currentOffset;
    },
    getPreviousPageParam: (_firstPage, allPages) => {
      if (allPages.length <= 1) return undefined;
      return (allPages.length - 2) * limit;
    },
    staleTime: config.staleTime,
    gcTime: config.gcTime
  });
}

/**
 * 页码分页配置工厂
 * 创建基于页码的无限查询配置，自动处理页码递增和总页数判断
 *
 * @template T - 数据项类型
 * @param {object} config - 配置对象
 * @param {QueryKey} config.queryKey - 查询键
 * @param {(page: number) => Promise<PageNumberPaginatedResponse<T>>} config.queryFn - 查询函数
 * @param {number} [config.staleTime] - 数据过期时间
 * @param {number} [config.gcTime] - 垃圾回收时间
 * @returns {object} 无限查询配置
 */
export function createPageNumberPaginationOptions<T>(config: {
  queryKey: QueryKey;
  queryFn: (page: number) => Promise<PageNumberPaginatedResponse<T>>;
  staleTime?: number;
  gcTime?: number;
}) {
  return createInfiniteQueryOptions({
    queryKey: config.queryKey,
    queryFn: ({ pageParam }) => config.queryFn(pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = allPages.length + 1;
      if (nextPage > lastPage.totalPages) {
        return undefined;
      }
      return nextPage;
    },
    getPreviousPageParam: (_firstPage, allPages) => {
      if (allPages.length <= 1) return undefined;
      return allPages.length - 1;
    },
    staleTime: config.staleTime,
    gcTime: config.gcTime
  });
}
