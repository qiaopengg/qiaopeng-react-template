/**
 * Query Options 助手函数
 * 提供更好的类型推断和配置复用
 */

import type { QueryFunction, QueryKey } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { DEFAULT_GC_TIME, DEFAULT_STALE_TIME, defaultQueryRetryStrategy, exponentialBackoff } from "./config";

/**
 * 创建带默认配置的查询选项
 * 自动应用默认的 staleTime, gcTime, retry 等配置
 *
 * @template TData - 数据类型
 * @param {object} config - 查询配置
 * @param {QueryKey} config.queryKey - 查询键
 * @param {QueryFunction<TData>} config.queryFn - 查询函数
 * @param {number} [config.staleTime] - 数据过期时间
 * @param {number} [config.gcTime] - 垃圾回收时间
 * @param {boolean} [config.enabled] - 是否启用查询
 * @returns {object} 查询选项对象
 */
export function createAppQueryOptions<TData>(config: {
  queryKey: QueryKey;
  queryFn: QueryFunction<TData>;
  staleTime?: number;
  gcTime?: number;
  enabled?: boolean;
}) {
  return queryOptions<TData, Error, TData, QueryKey>({
    queryKey: config.queryKey,
    queryFn: config.queryFn,
    staleTime: config.staleTime ?? DEFAULT_STALE_TIME,
    gcTime: config.gcTime ?? DEFAULT_GC_TIME,
    enabled: config.enabled,
    retry: defaultQueryRetryStrategy,
    retryDelay: exponentialBackoff,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true
  });
}

/**
 * 创建带数据选择器的查询选项
 * 支持数据转换和选择
 *
 * @template TData - 原始数据类型
 * @template TSelected - 选择后的数据类型
 * @param {object} config - 查询配置
 * @param {QueryKey} config.queryKey - 查询键
 * @param {QueryFunction<TData, QueryKey>} config.queryFn - 查询函数
 * @param {(data: TData) => TSelected} config.select - 数据选择器函数
 * @param {number} [config.staleTime] - 数据过期时间
 * @param {number} [config.gcTime] - 垃圾回收时间
 * @returns {object} 查询选项对象
 */
export function createAppQueryOptionsWithSelect<TData, TSelected = TData>(config: {
  queryKey: QueryKey;
  queryFn: QueryFunction<TData, QueryKey>;
  select: (data: TData) => TSelected;
  staleTime?: number;
  gcTime?: number;
}) {
  return queryOptions<TData, Error, TSelected, QueryKey>({
    queryKey: config.queryKey,
    queryFn: config.queryFn,
    select: config.select,
    staleTime: config.staleTime ?? DEFAULT_STALE_TIME,
    gcTime: config.gcTime ?? DEFAULT_GC_TIME,
    retry: defaultQueryRetryStrategy,
    retryDelay: exponentialBackoff,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true
  });
}
