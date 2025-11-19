/**
 * 焦点管理 Hooks 模块
 * 提供基于 React 的焦点管理 hooks，使用核心 focusManager 订阅机制，避免直接监听 window 事件
 */

import type { QueryKey } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { focusManager, getSmartFocusManager, pauseFocusManager, resumeFocusManager } from "../core/focusManager";

/** 类型定义 */

/**
 * 焦点刷新选项
 * @property {boolean} [enabled] - 是否启用
 * @property {number} [minInterval] - 最小刷新间隔（毫秒）
 * @property {QueryKey[]} [queryKeys] - 要刷新的查询键
 */
export interface UseFocusRefetchOptions {
  enabled?: boolean;
  minInterval?: number;
  queryKeys?: QueryKey[];
}

/**
 * 暂停焦点选项
 * @property {boolean} [autoPause] - 是否自动暂停
 * @property {boolean} [pauseWhen] - 暂停条件
 */
export interface UsePauseFocusOptions {
  autoPause?: boolean;
  pauseWhen?: boolean;
}

/** 焦点状态 Hook */

/**
 * 获取当前窗口焦点状态
 * 使用 focusManager.subscribe() 订阅焦点变化
 *
 * @returns {boolean} 当前窗口焦点状态（true 表示有焦点）
 */
export function useFocusState(): boolean {
  const [focused, setFocused] = useState(focusManager.isFocused());

  useEffect(() => {
    // 使用 focusManager 的订阅机制而不是直接监听 window 事件
    const unsubscribe = focusManager.subscribe((isFocused) => {
      setFocused(isFocused);
    });

    return unsubscribe;
  }, []);

  return focused;
}

/** 焦点时刷新 Hook */

/**
 * 当窗口获得焦点时刷新指定查询
 * 支持设置最小刷新间隔，避免频繁刷新
 *
 * @param {UseFocusRefetchOptions} [options] - 配置选项
 */
export function useFocusRefetch(options: UseFocusRefetchOptions = {}) {
  const queryClient = useQueryClient();
  const { enabled = true, minInterval = 5000, queryKeys = [] } = options;
  // 统一使用 SmartFocusManager 的刷新频率控制（按 queryKey 维度）
  const smartManager = getSmartFocusManager();

  // Memoize the query keys array to prevent unnecessary effect re-runs
  const queryKeysJson = JSON.stringify(queryKeys);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableQueryKeys = useMemo(() => queryKeys, [queryKeysJson]);

  useEffect(() => {
    if (!enabled || stableQueryKeys.length === 0) {
      return;
    }

    // 使用 focusManager 的订阅机制
    const unsubscribe = focusManager.subscribe((isFocused) => {
      if (!isFocused) {
        return;
      }

      stableQueryKeys.forEach((queryKey) => {
        if (smartManager.shouldRefetch(queryKey, minInterval)) {
          queryClient.invalidateQueries({ queryKey });
        }
      });
    });

    return unsubscribe;
  }, [queryClient, enabled, minInterval, stableQueryKeys, smartManager]);
}

/**
 * 暂停焦点管理 Hook
 * 提供暂停和恢复焦点管理的功能，暂停期间不会触发焦点相关的查询刷新
 *
 * @param {UsePauseFocusOptions} [options] - 配置选项
 * @returns {{ pause: () => void, resume: () => void }} 暂停和恢复方法
 */
export function usePauseFocus(options: UsePauseFocusOptions = {}) {
  const { autoPause = false, pauseWhen = false } = options;

  useEffect(() => {
    if (autoPause || pauseWhen) {
      pauseFocusManager();
      return () => {
        resumeFocusManager();
      };
    }
  }, [autoPause, pauseWhen]);

  const pause = useCallback(() => {
    pauseFocusManager();
  }, []);

  const resume = useCallback(() => {
    resumeFocusManager();
  }, []);

  return { pause, resume };
}

/**
 * 智能焦点管理 Hook
 * 支持嵌套的暂停/恢复操作和统计信息查看
 *
 * @returns {{ pause: () => void, resume: () => void, getStats: () => object, stats: object }} 焦点管理方法和统计信息
 */
export function useSmartFocusManager() {
  const manager = getSmartFocusManager();

  const pause = useCallback(() => {
    manager.pause();
  }, [manager]);

  const resume = useCallback(() => {
    manager.resume();
  }, [manager]);

  const getStats = useCallback(() => {
    return manager.getStats();
  }, [manager]);

  return {
    pause,
    resume,
    getStats,
    stats: manager.getStats()
  };
}

/** 条件焦点刷新 Hook */

/**
 * 条件焦点刷新 Hook
 * 根据条件决定是否在焦点时刷新查询
 *
 * @param {QueryKey} queryKey - 查询键
 * @param {() => boolean} condition - 条件函数
 * @param {object} [options] - 配置选项
 * @param {number} [options.minInterval] - 最小刷新间隔
 * @param {boolean} [options.enabled] - 是否启用
 */
export function useConditionalFocusRefetch(
  queryKey: QueryKey,
  condition: () => boolean,
  options: { minInterval?: number; enabled?: boolean } = {}
) {
  const queryClient = useQueryClient();
  const { minInterval = 5000, enabled = true } = options;
  // 统一使用 SmartFocusManager 的刷新频率控制（按 queryKey 维度）
  const smartManager = getSmartFocusManager();

  // Memoize the query key to prevent unnecessary effect re-runs
  const queryKeyJson = JSON.stringify(queryKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableQueryKey = useMemo(() => queryKey, [queryKeyJson]);

  // Store condition in a ref to avoid effect re-runs when callback changes
  const conditionRef = useRef(condition);
  useEffect(() => {
    conditionRef.current = condition;
  }, [condition]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // 使用 focusManager 的订阅机制
    const unsubscribe = focusManager.subscribe((isFocused) => {
      if (!isFocused || !conditionRef.current()) {
        return;
      }
      if (smartManager.shouldRefetch(stableQueryKey, minInterval)) {
        queryClient.invalidateQueries({ queryKey: stableQueryKey });
      }
    });

    return unsubscribe;
  }, [queryClient, stableQueryKey, minInterval, enabled, smartManager]);
}

/** 焦点时执行回调 Hook */

/**
 * 焦点时执行回调 Hook
 * 窗口获得焦点时执行指定回调函数
 *
 * @param {() => void} callback - 回调函数
 * @param {object} [options] - 配置选项
 * @param {number} [options.minInterval] - 最小执行间隔
 * @param {boolean} [options.enabled] - 是否启用
 * @param {import("@tanstack/react-query").QueryKey} [options.queryKey] - 关联的查询键
 */
export function useFocusCallback(
  callback: () => void,
  options: { minInterval?: number; enabled?: boolean; queryKey?: QueryKey } = {}
) {
  const { minInterval = 0, enabled = true, queryKey } = options;
  const lastCallTime = useRef<number>(0);
  const smartManager = getSmartFocusManager();

  // Memoize the query key to prevent unnecessary effect re-runs
  const queryKeyJson = JSON.stringify(queryKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableQueryKey = useMemo(() => queryKey, [queryKeyJson]);

  // Store callback in a ref to avoid effect re-runs when callback changes
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // 使用 focusManager 的订阅机制
    const unsubscribe = focusManager.subscribe((isFocused) => {
      if (!isFocused) {
        return;
      }

      // 优先使用 SmartFocusManager 的频率控制（当提供了 queryKey 时）
      if (stableQueryKey !== undefined) {
        if (smartManager.shouldRefetch(stableQueryKey, minInterval)) {
          callbackRef.current();
        }
        return;
      }

      // 未提供 queryKey，则退回到本地的时间间隔控制
      const now = Date.now();
      if (minInterval > 0 && now - lastCallTime.current < minInterval) {
        return;
      }
      lastCallTime.current = now;
      callbackRef.current();
    });

    return unsubscribe;
  }, [minInterval, enabled, stableQueryKey, smartManager]);
}

/** 页面可见性 Hook */

/**
 * 页面可见性 Hook
 * 跟踪页面可见性状态
 *
 * @returns {boolean} 页面是否可见
 */
export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(typeof document !== "undefined" ? !document.hidden : true);

  useEffect(() => {
    // 使用 focusManager 的订阅机制
    const unsubscribe = focusManager.subscribe((isFocused) => {
      setIsVisible(isFocused);
    });

    return unsubscribe;
  }, []);

  return isVisible;
}
