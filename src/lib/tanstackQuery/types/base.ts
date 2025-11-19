/**
 * 基础类型定义
 * 定义库中使用的基础类型、枚举和工具类型
 */

import type { QueryClient } from "@tanstack/react-query";
import type { PersistedClient, Persister } from "@tanstack/react-query-persist-client";

/** 存储类型枚举 */
export enum StorageType {
  LOCAL = "localStorage",
  SESSION = "sessionStorage",
  INDEXED_DB = "indexedDB",
  CUSTOM = "custom"
}

/** 连接质量枚举 */
export enum ConnectionQuality {
  SLOW = "slow",
  FAST = "fast",
  UNKNOWN = "unknown"
}

/** 缓存优先级枚举 */
export enum CachePriority {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low"
}

/** 持久化策略类型枚举 */
export enum PersistenceStrategyType {
  AGGRESSIVE = "aggressive", // 激进：持久化所有查询
  CONSERVATIVE = "conservative", // 保守：仅持久化成功的查询
  SELECTIVE = "selective", // 选择性：根据条件持久化
  CUSTOM = "custom" // 自定义策略
}

/**
 * 操作结果接口
 * @template T - 返回数据类型
 * @property {boolean} success - 操作是否成功
 * @property {T} [data] - 返回数据
 * @property {Error} [error] - 错误信息
 * @property {number} [duration] - 操作耗时（毫秒）
 * @property {Record<string, unknown>} [metadata] - 元数据
 */
export interface OperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: Error;
  duration?: number;
  metadata?: Record<string, unknown>;
}

/**
 * 网络连接信息接口
 * @property {"4g" | "3g" | "2g" | "slow-2g"} [effectiveType] - 有效连接类型
 * @property {boolean} [saveData] - 是否启用数据节省模式
 * @property {number} [downlink] - 下行速度（Mbps）
 * @property {number} [rtt] - 往返时间（ms）
 */
export interface NetworkInformation {
  effectiveType?: "4g" | "3g" | "2g" | "slow-2g";
  saveData?: boolean;
  downlink?: number;
  rtt?: number;
}

/**
 * 网络状态接口
 * @property {boolean} isOnline - 是否在线
 * @property {boolean} isOffline - 是否离线
 * @property {ConnectionQuality} connectionQuality - 连接质量
 * @property {NetworkInformation} [connection] - 网络连接信息
 * @property {Date} [lastOnlineAt] - 最后在线时间
 * @property {Date} [lastOfflineAt] - 最后离线时间
 */
export interface NetworkStatus {
  isOnline: boolean;
  isOffline: boolean;
  connectionQuality: ConnectionQuality;
  connection?: NetworkInformation;
  lastOnlineAt?: Date;
  lastOfflineAt?: Date;
}

/** 深度只读类型 - 递归将所有属性设为只读 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/** 可选属性类型 - 将指定属性设为可选 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** 必需属性类型 - 将指定属性设为必需 */
export type Required<T, K extends keyof T> = T & {
  [P in K]-?: T[P];
};

// 重新导出 TanStack Query 类型
export type { PersistedClient, Persister, QueryClient };
