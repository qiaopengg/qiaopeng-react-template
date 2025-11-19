/**
 * 网络检测工具
 *
 * 功能：检测网络状态和速度
 */

import type { NetworkInformation } from "../types/base";

/**
 * 扩展的 Navigator 接口
 */
export interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation; // 网络连接信息
}

/**
 * 类型守卫：检查 navigator 是否支持 connection API
 */
function hasConnectionAPI(nav: Navigator): nav is NavigatorWithConnection {
  return "connection" in nav;
}

/**
 * 检测是否为慢速网络
 * @returns {boolean} 是否为慢速网络
 */
export function isSlowNetwork(): boolean {
  // SSR 环境检查
  if (typeof navigator === "undefined") {
    return false;
  }

  // 使用类型守卫检查 API 支持
  if (!hasConnectionAPI(navigator)) {
    return false;
  }

  const connection = navigator.connection;
  if (!connection) {
    return false;
  }

  // 检查慢速网络条件
  return connection.effectiveType === "slow-2g" || connection.effectiveType === "2g" || connection.saveData === true;
}

/**
 * 获取网络信息
 * @returns {NetworkInformation | null} 网络信息对象或 null
 */
export function getNetworkInfo(): NetworkInformation | null {
  // SSR 环境检查
  if (typeof navigator === "undefined") {
    return null;
  }

  // 使用类型守卫检查 API 支持
  if (!hasConnectionAPI(navigator)) {
    return null;
  }

  return navigator.connection || null;
}

/**
 * 检测是否为快速网络
 * @returns {boolean} 是否为快速网络
 */
export function isFastNetwork(): boolean {
  const networkInfo = getNetworkInfo();

  if (!networkInfo) {
    // 默认假设为快速网络（乐观策略）
    return true;
  }

  return networkInfo.effectiveType === "4g" && networkInfo.saveData !== true;
}

/**
 * 获取网络速度等级
 * @returns {"fast" | "medium" | "slow" | "unknown"} 网络速度等级
 */
export function getNetworkSpeed(): "fast" | "medium" | "slow" | "unknown" {
  const networkInfo = getNetworkInfo();

  if (!networkInfo || !networkInfo.effectiveType) {
    return "unknown";
  }

  switch (networkInfo.effectiveType) {
    case "4g":
      return "fast";
    case "3g":
      return "medium";
    case "2g":
    case "slow-2g":
      return "slow";
    default:
      return "unknown";
  }
}
