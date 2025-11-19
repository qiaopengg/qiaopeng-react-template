/**
 * 预取 Hooks
 * 提供多种预取策略的 React Hooks
 */

import type { QueryFunction, QueryKey } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { DEFAULT_STALE_TIME } from "../core/config";
import { isSlowNetwork } from "../utils/network";

export interface PrefetchOptions {
  delay?: number;
  enabled?: boolean;
  staleTime?: number;
}

export interface HoverPrefetchOptions extends PrefetchOptions {
  hoverDelay?: number;
}

export interface InViewPrefetchOptions extends PrefetchOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * 鼠标悬停预取 Hook
 * 鼠标悬停时预取数据
 *
 * @template TData - 数据类型
 * @param {QueryKey} queryKey - 查询键
 * @param {QueryFunction<TData>} queryFn - 查询函数
 * @param {HoverPrefetchOptions} [options] - 预取选项
 * @returns {{ onMouseEnter: () => void, onMouseLeave: () => void, onFocus: () => void }} 事件处理器对象
 */
export function useHoverPrefetch<TData = unknown>(
  queryKey: QueryKey,
  queryFn: QueryFunction<TData>,
  options: HoverPrefetchOptions = {}
) {
  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const { hoverDelay = 200, enabled = true, staleTime = DEFAULT_STALE_TIME } = options;

  const queryFnRef = useRef(queryFn);
  useEffect(() => {
    queryFnRef.current = queryFn;
  }, [queryFn]);

  const prefetch = useCallback(() => {
    if (!enabled) return;

    queryClient.prefetchQuery({
      queryKey,
      queryFn: queryFnRef.current,
      staleTime
    });
  }, [queryClient, queryKey, enabled, staleTime]);

  const handleMouseEnter = useCallback(() => {
    if (!enabled) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(prefetch, hoverDelay);
  }, [prefetch, hoverDelay, enabled]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: prefetch
  };
}

/**
 * 视口预取 Hook
 * 元素进入视口时预取数据
 *
 * @template TData - 数据类型
 * @param {QueryKey} queryKey - 查询键
 * @param {QueryFunction<TData>} queryFn - 查询函数
 * @param {InViewPrefetchOptions} [options] - 预取选项
 * @returns {React.RefObject} ref 引用
 */
export function useInViewPrefetch<TData = unknown>(
  queryKey: QueryKey,
  queryFn: QueryFunction<TData>,
  options: InViewPrefetchOptions = {}
) {
  const queryClient = useQueryClient();

  const {
    threshold = 0.1,
    rootMargin = "50px",
    triggerOnce = true,
    enabled = true,
    staleTime = DEFAULT_STALE_TIME
  } = options;

  const [ref, inView] = useInView({
    threshold,
    rootMargin,
    triggerOnce
  });

  // ✅ 使用 useRef 存储 queryFn 以避免依赖项变化
  const queryFnRef = useRef(queryFn);
  useEffect(() => {
    queryFnRef.current = queryFn;
  }, [queryFn]);

  // ✅ 使用 useMemo 稳定 queryKey 引用
  const stableQueryKey = useRef(queryKey);
  useEffect(() => {
    if (JSON.stringify(stableQueryKey.current) !== JSON.stringify(queryKey)) {
      stableQueryKey.current = queryKey;
    }
  }, [queryKey]);

  useEffect(() => {
    if (inView && enabled) {
      // ✅ 直接调用 prefetchQuery，信任框架处理缓存逻辑
      queryClient.prefetchQuery({
        queryKey: stableQueryKey.current,
        queryFn: queryFnRef.current,
        staleTime
      });
    }
  }, [inView, queryClient, enabled, staleTime]);

  return ref;
}

/**
 * 路由预取 Hook - 路由跳转前预取数据
 * @returns 预取函数
 */
export function useRoutePrefetch() {
  const queryClient = useQueryClient();

  return useCallback(
    <TData = unknown>(queryKey: QueryKey, queryFn: QueryFunction<TData>, options?: PrefetchOptions) => {
      const { enabled = true, staleTime = DEFAULT_STALE_TIME } = options || {};

      if (!enabled) return;

      // ✅ 直接调用 prefetchQuery，信任框架处理缓存逻辑
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime
      });
    },
    [queryClient]
  );
}

/**
 * 批量预取 Hook - 批量预取多个查询
 * @returns 批量预取函数
 */
export function useBatchPrefetch() {
  const queryClient = useQueryClient();

  return useCallback(
    <TData = unknown>(
      queries: Array<{
        queryKey: QueryKey;
        queryFn: QueryFunction<TData>;
        staleTime?: number;
      }>
    ) => {
      // ✅ 直接调用 prefetchQuery，TanStack Query 会自动去重和处理缓存
      queries.forEach(({ queryKey, queryFn, staleTime = DEFAULT_STALE_TIME }) => {
        queryClient.prefetchQuery({
          queryKey,
          queryFn,
          staleTime
        });
      });
    },
    [queryClient]
  );
}

/**
 * 智能预取 Hook - 根据网络状况智能预取数据
 * @returns { prefetch, shouldPrefetch } 预取函数和是否应该预取的标志
 */
export function useSmartPrefetch() {
  const queryClient = useQueryClient();
  const prefetchedRef = useRef(new Set<string>());

  // ✅ 简化逻辑：只保留网络检测和预取历史记录
  // 移除冗余的缓存检查，让 TanStack Query 自动处理
  const shouldPrefetchQuery = useCallback((queryKey: QueryKey): boolean => {
    const key = JSON.stringify(queryKey);

    // ✅ 保留：检查是否已经预取过（避免重复预取）
    if (prefetchedRef.current.has(key)) {
      return false;
    }

    // ✅ 保留：网络检测（智能预取的核心功能）
    if (isSlowNetwork()) {
      return false;
    }

    return true;
  }, []);

  // 执行预取
  const prefetch = useCallback(
    <TData = unknown>(queryKey: QueryKey, queryFn: QueryFunction<TData>, options?: PrefetchOptions) => {
      if (!shouldPrefetchQuery(queryKey)) {
        return;
      }

      const { staleTime = DEFAULT_STALE_TIME } = options || {};
      const key = JSON.stringify(queryKey);

      // 记录预取历史
      prefetchedRef.current.add(key);

      // ✅ 让 TanStack Query 处理缓存逻辑
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime
      });
    },
    [queryClient, shouldPrefetchQuery]
  );

  // 清除预取记录
  const clearPrefetchHistory = useCallback(() => {
    prefetchedRef.current.clear();
  }, []);

  return {
    prefetch,
    shouldPrefetch: !isSlowNetwork(),
    clearPrefetchHistory
  };
}

/**
 * 条件预取 Hook - 根据条件预取数据
 * @template TData - 数据类型
 * @param queryKey - 查询键
 * @param queryFn - 查询函数
 * @param condition - 条件
 * @param options - 预取选项 { delay?, enabled?, staleTime? }
 */
export function useConditionalPrefetch<TData = unknown>(
  queryKey: QueryKey,
  queryFn: QueryFunction<TData>,
  condition: boolean,
  options?: PrefetchOptions
) {
  const queryClient = useQueryClient();
  const { staleTime = DEFAULT_STALE_TIME, delay = 0 } = options || {};

  // ✅ 使用 useRef 存储 queryFn 以避免依赖项变化
  const queryFnRef = useRef(queryFn);
  useEffect(() => {
    queryFnRef.current = queryFn;
  }, [queryFn]);

  // ✅ 使用 useRef 稳定 queryKey 引用
  const stableQueryKey = useRef(queryKey);
  useEffect(() => {
    if (JSON.stringify(stableQueryKey.current) !== JSON.stringify(queryKey)) {
      stableQueryKey.current = queryKey;
    }
  }, [queryKey]);

  useEffect(() => {
    if (!condition) return;

    const timeoutId = setTimeout(() => {
      // ✅ 直接调用 prefetchQuery，信任框架处理缓存逻辑
      queryClient.prefetchQuery({
        queryKey: stableQueryKey.current,
        queryFn: queryFnRef.current,
        staleTime
      });
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [condition, queryClient, staleTime, delay]);
}

/**
 * 空闲时预取 Hook - 浏览器空闲时预取数据
 * @template TData - 数据类型
 * @param queryKey - 查询键
 * @param queryFn - 查询函数
 * @param options - 预取选项 { timeout?, enabled?, staleTime? }
 */
export function useIdlePrefetch<TData = unknown>(
  queryKey: QueryKey,
  queryFn: QueryFunction<TData>,
  options?: PrefetchOptions & { timeout?: number }
) {
  const queryClient = useQueryClient();
  const { staleTime = DEFAULT_STALE_TIME, enabled = true, timeout = 1000 } = options || {};

  // ✅ 使用 useRef 存储 queryFn 以避免依赖项变化
  const queryFnRef = useRef(queryFn);
  useEffect(() => {
    queryFnRef.current = queryFn;
  }, [queryFn]);

  // ✅ 使用 useRef 稳定 queryKey 引用
  const stableQueryKey = useRef(queryKey);
  useEffect(() => {
    if (JSON.stringify(stableQueryKey.current) !== JSON.stringify(queryKey)) {
      stableQueryKey.current = queryKey;
    }
  }, [queryKey]);

  useEffect(() => {
    if (!enabled) return;

    // 检查浏览器是否支持 requestIdleCallback
    if (typeof window === "undefined" || !("requestIdleCallback" in window)) {
      // 降级到 setTimeout
      const timeoutId = setTimeout(() => {
        // ✅ 直接调用 prefetchQuery，信任框架处理缓存逻辑
        queryClient.prefetchQuery({
          queryKey: stableQueryKey.current,
          queryFn: queryFnRef.current,
          staleTime
        });
      }, timeout);

      return () => clearTimeout(timeoutId);
    }

    // 使用 requestIdleCallback
    const idleCallbackId = window.requestIdleCallback(
      () => {
        // ✅ 直接调用 prefetchQuery，信任框架处理缓存逻辑
        queryClient.prefetchQuery({
          queryKey: stableQueryKey.current,
          queryFn: queryFnRef.current,
          staleTime
        });
      },
      { timeout }
    );

    return () => window.cancelIdleCallback(idleCallbackId);
  }, [queryClient, staleTime, enabled, timeout]);
}

/**
 * 定时预取 Hook - 定时预取数据
 * @template TData - 数据类型
 * @param queryKey - 查询键
 * @param queryFn - 查询函数
 * @param options - 预取选项 { interval?, enabled?, staleTime? }
 */
export function usePeriodicPrefetch<TData = unknown>(
  queryKey: QueryKey,
  queryFn: QueryFunction<TData>,
  options?: PrefetchOptions & { interval?: number }
) {
  const queryClient = useQueryClient();
  const { staleTime = DEFAULT_STALE_TIME, enabled = true, interval = 60000 } = options || {};

  // ✅ 使用 useRef 存储 queryFn 以避免依赖项变化
  const queryFnRef = useRef(queryFn);
  useEffect(() => {
    queryFnRef.current = queryFn;
  }, [queryFn]);

  // ✅ 使用 useRef 稳定 queryKey 引用
  const stableQueryKey = useRef(queryKey);
  useEffect(() => {
    if (JSON.stringify(stableQueryKey.current) !== JSON.stringify(queryKey)) {
      stableQueryKey.current = queryKey;
    }
  }, [queryKey]);

  useEffect(() => {
    if (!enabled) return;

    const prefetchData = () => {
      // ✅ 直接调用 prefetchQuery，信任框架处理缓存逻辑
      queryClient.prefetchQuery({
        queryKey: stableQueryKey.current,
        queryFn: queryFnRef.current,
        staleTime
      });
    };

    // 立即执行一次
    prefetchData();

    // 设置定时器
    const intervalId = setInterval(prefetchData, interval);

    return () => clearInterval(intervalId);
  }, [queryClient, staleTime, enabled, interval]);
}

/**
 * 预测性预取 Hook(实验性功能) - 根据用户行为预测并预取数据
 * @returns { recordInteraction, prefetchPredicted } 记录交互和预测性预取函数
 */
export function usePredictivePrefetch() {
  const queryClient = useQueryClient();
  const interactionHistoryRef = useRef<Array<{ action: string; target: string; timestamp: number }>>([]);
  const maxHistorySize = 50;

  // 记录用户交互
  const recordInteraction = useCallback((action: string, target: string) => {
    interactionHistoryRef.current.push({
      action,
      target,
      timestamp: Date.now()
    });

    // 限制历史记录大小
    if (interactionHistoryRef.current.length > maxHistorySize) {
      interactionHistoryRef.current.shift();
    }
  }, []);

  // 获取预测结果
  const getPredictions = useCallback(() => {
    const history = interactionHistoryRef.current;
    if (history.length < 3) return [];

    // 简单的预测算法：找出最常访问的目标
    const targetCounts = new Map<string, number>();

    history.forEach(({ target }) => {
      targetCounts.set(target, (targetCounts.get(target) || 0) + 1);
    });

    // 按访问次数排序
    return Array.from(targetCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([target]) => target);
  }, []);

  // 预取预测的数据
  const prefetchPredicted = useCallback(
    <TData = unknown>(getQueryConfig: (target: string) => { queryKey: QueryKey; queryFn: QueryFunction<TData> }) => {
      const predictions = getPredictions();

      predictions.forEach((target) => {
        const { queryKey, queryFn } = getQueryConfig(target);
        // ✅ 直接调用 prefetchQuery，信任框架处理缓存逻辑
        queryClient.prefetchQuery({ queryKey, queryFn });
      });
    },
    [queryClient, getPredictions]
  );

  // 清除历史记录
  const clearHistory = useCallback(() => {
    interactionHistoryRef.current = [];
  }, []);

  return {
    recordInteraction,
    getPredictions,
    prefetchPredicted,
    clearHistory
  };
}

/**
 * 优先级预取 Hook - 按优先级预取数据
 * @returns { addPrefetchTask, processTasks } 添加预取任务和处理任务函数
 */
export function usePriorityPrefetch() {
  const queryClient = useQueryClient();
  const tasksRef = useRef<
    Array<{
      queryKey: QueryKey;
      queryFn: QueryFunction<any>;
      priority: "high" | "medium" | "low";
      timestamp: number;
    }>
  >([]);
  const [taskCount, setTaskCount] = useState(0);

  // 添加预取任务
  const addPrefetchTask = useCallback(
    <TData = unknown>(
      queryKey: QueryKey,
      queryFn: QueryFunction<TData>,
      priority: "high" | "medium" | "low" = "medium"
    ) => {
      tasksRef.current.push({
        queryKey,
        queryFn,
        priority,
        timestamp: Date.now()
      });
      setTaskCount(tasksRef.current.length);
    },
    []
  );

  // 处理任务队列
  const processTasks = useCallback(async () => {
    // 按优先级排序
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const sortedTasks = [...tasksRef.current].sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp - b.timestamp;
    });

    // 依次执行预取
    // ✅ 直接调用 prefetchQuery，信任框架处理缓存逻辑
    for (const task of sortedTasks) {
      await queryClient.prefetchQuery({
        queryKey: task.queryKey,
        queryFn: task.queryFn
      });
    }

    // 清空任务队列
    tasksRef.current = [];
    setTaskCount(0);
  }, [queryClient]);

  // 清空任务队列
  const clearTasks = useCallback(() => {
    tasksRef.current = [];
    setTaskCount(0);
  }, []);

  return {
    addPrefetchTask,
    processTasks,
    clearTasks,
    taskCount
  };
}
