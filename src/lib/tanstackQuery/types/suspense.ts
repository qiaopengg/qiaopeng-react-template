/**
 * Suspense 类型定义
 * 定义 Suspense 查询相关的类型
 */

import type {
  InfiniteData,
  QueryKey,
  UseSuspenseInfiniteQueryOptions,
  UseSuspenseInfiniteQueryResult,
  UseSuspenseQueryOptions,
  UseSuspenseQueryResult
} from "@tanstack/react-query";
import type { ReactNode } from "react";

/**
 * 增强的 Suspense Query 选项
 * @template TQueryFnData - 查询函数返回数据类型
 * @template TError - 错误类型
 * @template TData - 最终数据类型
 * @template TQueryKey - 查询键类型
 * @property {boolean} [enableAutoRefresh] - 是否启用自动刷新
 * @property {number} [refreshInterval] - 刷新间隔（毫秒）
 */
export interface EnhancedSuspenseQueryOptions<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
> extends Omit<UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, "queryKey" | "queryFn"> {
  enableAutoRefresh?: boolean; // 是否启用自动刷新
  refreshInterval?: number; // 刷新间隔（毫秒）
}

/**
 * 增强的 Suspense Infinite Query 选项
 * @template TQueryFnData - 查询函数返回数据类型
 * @template TError - 错误类型
 * @template TData - 最终数据类型
 * @template TQueryKey - 查询键类型
 * @template TPageParam - 页面参数类型
 */
export interface EnhancedSuspenseInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown
> extends Omit<
    UseSuspenseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
    "queryKey" | "queryFn"
  > {
  enableAutoRefresh?: boolean; // 是否启用自动刷新
  refreshInterval?: number; // 刷新间隔（毫秒）
}

/**
 * Suspense Query 函数类型
 */
export type SuspenseQueryFunction<TQueryFnData = unknown, TQueryKey extends QueryKey = QueryKey> = (context: {
  queryKey: TQueryKey;
  signal: AbortSignal;
}) => Promise<TQueryFnData>;

/**
 * Suspense Infinite Query 函数类型
 */
export type SuspenseInfiniteQueryFunction<
  TQueryFnData = unknown,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown
> = (context: { queryKey: TQueryKey; signal: AbortSignal; pageParam: TPageParam }) => Promise<TQueryFnData>;

/**
 * Suspense Query 结果类型
 */
export type EnhancedSuspenseQueryResult<TData = unknown, TError = Error> = UseSuspenseQueryResult<TData, TError>;

/**
 * Suspense Infinite Query 结果类型
 */
export type EnhancedSuspenseInfiniteQueryResult<TData = unknown, TError = Error> = UseSuspenseInfiniteQueryResult<
  InfiniteData<TData>,
  TError
>;

/**
 * Suspense 包装组件属性
 */
export interface SuspenseWrapperProps {
  children: ReactNode; // 子组件
  fallback?: ReactNode; // 加载占位
  errorFallback?: (error: Error, resetErrorBoundary: () => void) => ReactNode; // 错误占位
  onError?: (error: Error, errorInfo: { componentStack: string }) => void; // 错误回调
  resetKeys?: Array<string | number>; // 重置键
}

/**
 * 错误边界属性
 */
export interface ErrorBoundaryProps {
  children: ReactNode; // 子组件
  fallback?: (error: Error, resetErrorBoundary: () => void) => ReactNode; // 错误占位
  onError?: (error: Error, errorInfo: { componentStack: string }) => void; // 错误回调
  onReset?: () => void; // 重置回调
  resetKeys?: Array<string | number>; // 重置键
}

/**
 * 错误边界状态
 */
export interface ErrorBoundaryState {
  hasError: boolean; // 是否有错误
  error?: Error; // 错误对象
}

/**
 * 加载占位组件属性
 */
export interface LoadingFallbackProps {
  message?: string; // 加载消息
  size?: "small" | "medium" | "large"; // 尺寸
  className?: string; // 样式类名
}

/**
 * 错误占位组件属性
 */
export interface ErrorFallbackProps {
  error: Error; // 错误对象
  resetErrorBoundary: () => void; // 重置错误边界
  className?: string; // 样式类名
}

/**
 * Suspense 配置选项
 */
export interface SuspenseConfig {
  defaultStaleTime?: number; // 默认缓存时间
  defaultGcTime?: number; // 默认垃圾回收时间
  defaultRetry?: number | boolean; // 默认重试配置
  enableDevtools?: boolean; // 是否启用开发工具
}

/**
 * 查询状态类型
 */
export type QueryStatus = "pending" | "error" | "success";

/**
 * 查询元数据
 */
export interface QueryMetadata {
  queryKey: QueryKey; // 查询键
  status: QueryStatus; // 查询状态
  lastUpdated?: Date; // 最后更新时间
  errorCount?: number; // 错误次数
}
