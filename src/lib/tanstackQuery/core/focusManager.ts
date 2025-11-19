/**
 * 窗口焦点管理器
 * 管理窗口焦点状态，控制查询的自动刷新行为
 */

import type { QueryKey } from "@tanstack/react-query";
import { focusManager } from "@tanstack/react-query";

export { focusManager };

/**
 * 焦点管理器配置
 * @property {boolean} [enabled] - 是否启用焦点管理
 * @property {(handleFocus: (focused: boolean) => void) => () => void} [customEventListener] - 自定义事件监听器
 * @property {boolean} [refetchOnWindowFocus] - 窗口获得焦点时是否刷新
 */
export interface FocusManagerConfig {
  enabled?: boolean;
  /**
   * 与 TanStack Query 的约定保持一致：handleFocus 为无参回调
   * 在 visibilitychange、focus 等事件触发时调用 handleFocus() 即可
   */
  customEventListener?: (handleFocus: () => void) => () => void;
  /**
   * 注意：建议通过 QueryClient 的 defaultOptions.queries.refetchOnWindowFocus 来控制
   * 此处仅保留该字段以保持向后兼容，不再直接修改 focusManager 的状态
   * @deprecated 保留占位，不再生效，请改用 QueryClient 配置
   */
  refetchOnWindowFocus?: boolean;
}

/**
 * 配置全局焦点管理器
 * 设置焦点事件监听和刷新行为
 *
 * @param {FocusManagerConfig} [config] - 焦点管理器配置
 */
export function setupFocusManager(config: FocusManagerConfig = {}) {
  const { enabled = true, customEventListener, refetchOnWindowFocus: _refetchOnWindowFocus = true } = config;

  if (!enabled) {
    // 禁用焦点管理：移除/替换事件监听器，并强制置为不聚焦
    focusManager.setEventListener(() => () => {});
    focusManager.setFocused(false);
    return;
  }

  // 设置自定义事件监听器
  if (customEventListener) {
    focusManager.setEventListener(customEventListener);
  } else {
    // 使用默认的 visibilitychange 事件
    focusManager.setEventListener((handleFocus) => {
      if (typeof window === "undefined" || !window.addEventListener) {
        return () => {};
      }

      // 在可见性变化与窗口获得焦点时触发 handleFocus()
      const handleVisibilityChange = () => {
        // 交由 Query 核心自行判断是否可见/在线并决定是否触发刷新
        handleFocus();
      };

      // 需要在移除监听时使用同一个函数引用
      const handleWindowFocus = () => handleFocus();

      window.addEventListener("visibilitychange", handleVisibilityChange, false);
      window.addEventListener("focus", handleWindowFocus, false);

      return () => {
        window.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("focus", handleWindowFocus);
      };
    });
  }
}

/**
 * 暂停焦点管理
 * 禁用窗口焦点时的自动刷新
 */
export function pauseFocusManager() {
  focusManager.setFocused(false);
}

/**
 * 恢复焦点管理
 * 恢复窗口焦点时的自动刷新
 */
export function resumeFocusManager() {
  const isVisible = typeof document !== "undefined" ? !document.hidden : true;
  focusManager.setFocused(isVisible);
}

/**
 * 智能焦点管理器
 * 提供嵌套暂停/恢复功能和刷新频率控制
 */
export class SmartFocusManager {
  private pauseCount = 0;
  private originalFocusState: boolean | undefined;
  private refetchHistory: Map<string, number> = new Map();
  // 统一的安全键序列化函数
  private serializeKey(queryKey: QueryKey): string {
    try {
      return JSON.stringify(queryKey);
    } catch {
      return Array.isArray(queryKey)
        ? queryKey
            .map((v) => {
              try {
                return JSON.stringify(v);
              } catch {
                return String(v);
              }
            })
            .join("|")
        : String(queryKey);
    }
  }

  /**
   * 暂停焦点管理（支持嵌套）
   */
  pause(): void {
    if (this.pauseCount === 0) {
      this.originalFocusState = focusManager.isFocused();
      focusManager.setFocused(false);
    }
    this.pauseCount++;
  }

  /**
   * 恢复焦点管理
   */
  resume(): void {
    if (this.pauseCount > 0) {
      this.pauseCount--;
      if (this.pauseCount === 0) {
        focusManager.setFocused(this.originalFocusState);
      }
    }
  }

  /**
   * 重置状态
   */
  reset(): void {
    if (this.pauseCount > 0) {
      this.pauseCount = 0;
      focusManager.setFocused(this.originalFocusState);
      this.originalFocusState = undefined;
    }
  }

  /**
   * 销毁管理器并清理资源
   */
  destroy(): void {
    this.reset();
    this.clearHistory();
  }

  /**
   * 判断是否应该刷新查询
   * 基于最小刷新间隔控制刷新频率
   *
   * @param {readonly unknown[]} queryKey - 查询键
   * @param {number} [minInterval] - 最小刷新间隔（毫秒）
   * @returns {boolean} 是否应该刷新
   */
  shouldRefetch(queryKey: QueryKey, minInterval: number = 5000): boolean {
    // 使用安全的键序列化，避免不可序列化对象导致异常
    const key = this.serializeKey(queryKey);
    // 如果没有历史记录，则允许立即刷新
    const lastRefetchTime = this.refetchHistory.has(key) ? this.refetchHistory.get(key)! : -Infinity;
    const now = Date.now();

    if (now - lastRefetchTime < minInterval) {
      return false;
    }

    this.refetchHistory.set(key, now);
    return true;
  }

  /**
   * 清除刷新历史记录
   */
  clearHistory(): void {
    this.refetchHistory.clear();
  }

  /**
   * 清除指定查询键的刷新历史
   */
  clearHistoryByKey(queryKey: QueryKey): void {
    const key = this.serializeKey(queryKey);
    this.refetchHistory.delete(key);
  }

  /**
   * 获取某个查询键上次刷新时间
   */
  getLastRefetchTime(queryKey: QueryKey): number | undefined {
    const key = this.serializeKey(queryKey);
    return this.refetchHistory.get(key);
  }

  /**
   * 获取统计信息
   * @returns {{ isPaused: boolean, pauseCount: number, isFocused: boolean }} 统计信息对象
   */
  getStats(): {
    isPaused: boolean;
    pauseCount: number;
    isFocused: boolean;
  } {
    return {
      isPaused: this.pauseCount > 0,
      pauseCount: this.pauseCount,
      isFocused: focusManager.isFocused()
    };
  }
}

let smartFocusManagerInstance: SmartFocusManager | null = null;

/**
 * 获取智能焦点管理器实例（单例）
 * @returns {SmartFocusManager} 智能焦点管理器实例
 */
export function getSmartFocusManager(): SmartFocusManager {
  if (!smartFocusManagerInstance) {
    smartFocusManagerInstance = new SmartFocusManager();
  }
  return smartFocusManagerInstance;
}

/**
 * 重置智能焦点管理器实例
 */
export function resetSmartFocusManager(): void {
  smartFocusManagerInstance = null;
}
