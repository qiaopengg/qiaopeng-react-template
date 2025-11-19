/**
 * 通用预取 Hook
 *
 * 用于预取数据和懒加载组件，提升用户体验
 */

import { useQueryClient } from "@qiaopeng/tanstack-query-plus";
import { useRef, useState } from "react";

/**
 * 预取配置
 */
export interface PrefetchConfig {
  /**
   * 单个查询配置
   * 与 React Query 的 queryOptions 兼容
   */
  queryOptions?: any;

  /**
   * 多个查询配置
   */
  queries?: any[];

  /**
   * 单个组件导入函数
   */
  componentImport?: () => Promise<any>;

  /**
   * 多个组件导入函数
   */
  components?: (() => Promise<any>)[];

  /**
   * 是否启用预取
   * @default true
   */
  enabled?: boolean;

  /**
   * 是否只预取一次
   * @default true
   */
  once?: boolean;

  /**
   * 预取成功回调
   */
  onSuccess?: () => void;

  /**
   * 预取失败回调
   */
  onError?: (error: Error) => void;
}

/**
 * 预取结果
 */
export interface PrefetchResult {
  /**
   * 执行预取
   */
  prefetch: () => void;

  /**
   * 是否已预取
   */
  isPrefetched: boolean;

  /**
   * 重置预取状态
   */
  reset: () => void;
}

/**
 * 通用预取 Hook
 *
 * 特性：
 * - 支持预取单个或多个查询
 * - 支持预加载单个或多个组件
 * - 支持条件预取
 * - 支持只预取一次
 * - 自动错误处理
 *
 * @param config - 预取配置
 * @returns { prefetch, isPrefetched, reset } - 预取方法和状态
 */
export function usePrefetch(config: PrefetchConfig): PrefetchResult {
  const queryClient = useQueryClient();
  const isPrefetchedRef = useRef(false);
  const [isPrefetched, setIsPrefetched] = useState(false);

  const {
    queryOptions,
    queries = [],
    componentImport,
    components = [],
    enabled = true,
    once = true,
    onSuccess,
    onError
  } = config;

  /**
   * 执行预取
   */
  const prefetch = () => {
    // 如果未启用，直接返回
    if (!enabled) {
      return;
    }

    // 如果设置了只预取一次，且已预取，直接返回
    if (once && isPrefetchedRef.current) {
      return;
    }

    try {
      // 预取单个查询
      if (queryOptions) {
        queryClient.prefetchQuery(queryOptions);
      }

      // 预取多个查询
      if (queries.length > 0) {
        queries.forEach((query) => {
          queryClient.prefetchQuery(query);
        });
      }

      // 预加载单个组件
      if (componentImport) {
        componentImport().catch((error) => {
          console.error("[usePrefetch] 组件预加载失败:", error);
          onError?.(error);
        });
      }

      // 预加载多个组件
      if (components.length > 0) {
        components.forEach((component) => {
          component().catch((error) => {
            console.error("[usePrefetch] 组件预加载失败:", error);
            onError?.(error);
          });
        });
      }

      // 标记为已预取
      isPrefetchedRef.current = true;
      setIsPrefetched(true);

      // 调用成功回调
      onSuccess?.();
    } catch (error) {
      console.error("[usePrefetch] 预取失败:", error);
      onError?.(error as Error);
    }
  };

  /**
   * 重置预取状态
   */
  const reset = () => {
    isPrefetchedRef.current = false;
    setIsPrefetched(false);
  };

  return {
    prefetch,
    isPrefetched,
    reset
  };
}

/**
 * 创建预取增强的操作函数
 *
 * 用于在执行操作前自动预取资源
 *
 * @param action - 原始操作函数
 * @param prefetchFn - 预取函数
 * @returns 增强后的操作函数
 */
export function createPrefetchedAction<T extends (...args: any[]) => any>(action: T, prefetchFn: () => void): T {
  return ((...args: any[]) => {
    prefetchFn();
    return action(...args);
  }) as T;
}

/**
 * 批量创建预取增强的操作函数
 *
 * @param actions - 操作函数对象
 * @param prefetchFn - 预取函数
 * @returns 增强后的操作函数对象
 */
export function createPrefetchedActions<T extends Record<string, (...args: any[]) => any>>(
  actions: T,
  prefetchFn: () => void
): T {
  const prefetchedActions = {} as T;

  Object.keys(actions).forEach((key) => {
    const typedKey = key as keyof T;
    prefetchedActions[typedKey] = createPrefetchedAction(actions[typedKey], prefetchFn) as T[keyof T];
  });

  return prefetchedActions;
}

/**
 * 预取策略配置
 */
export interface PrefetchStrategy {
  /**
   * 在 hover 时预取
   * @default true
   */
  onHover?: boolean;

  /**
   * 在 focus 时预取
   * @default true
   */
  onFocus?: boolean;

  /**
   * 在 click 时预取
   * @default true
   */
  onClick?: boolean;

  /**
   * 延迟预取（毫秒）
   * @default 0
   */
  delay?: number;
}

/**
 * 创建预取事件处理器
 *
 * 根据策略自动生成事件处理器
 *
 * @param prefetchFn - 预取函数
 * @param strategy - 预取策略
 * @returns 事件处理器对象
 */
export function createPrefetchHandlers(
  prefetchFn: () => void,
  strategy: PrefetchStrategy = {}
): Record<string, () => void> {
  const { onHover = true, onFocus = true, onClick = false, delay = 0 } = strategy;

  const handlers: Record<string, () => void> = {};

  const delayedPrefetch = delay > 0 ? () => setTimeout(prefetchFn, delay) : prefetchFn;

  if (onHover) {
    handlers.onMouseEnter = delayedPrefetch;
  }

  if (onFocus) {
    handlers.onFocus = delayedPrefetch;
  }

  if (onClick) {
    handlers.onClick = delayedPrefetch;
  }

  return handlers;
}
