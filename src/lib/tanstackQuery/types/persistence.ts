/**
 * 持久化类型定义
 * 定义持久化功能相关的类型和接口
 */

import type { QueryKey } from "@tanstack/react-query";
import type { CachePriority, OperationResult, PersistenceStrategyType, StorageType } from "./base";

/**
 * 数据序列化器
 */
export interface DataSerializer<T = unknown> {
  serialize: (data: T) => string | Promise<string>; // 序列化数据
  deserialize: (data: string) => T | Promise<T>; // 反序列化数据
}

/**
 * 数据反序列化器
 */
export interface DataDeserializer<T = unknown> {
  deserialize: (data: string) => T | Promise<T>; // 反序列化数据
}

/**
 * 存储使用信息
 */
export interface StorageInfo {
  type: StorageType; // 存储类型
  used: number; // 已使用空间（字节）
  total: number; // 总可用空间（字节）
  usage: number; // 使用率（0-1）
  available: boolean; // 是否可用
  error?: string; // 错误信息
}

/**
 * 缓存项信息
 */
export interface CacheItemInfo {
  queryKey: QueryKey; // 查询键
  size: number; // 数据大小（字节）
  createdAt: Date; // 创建时间
  lastAccessedAt: Date; // 最后访问时间
  expiresAt?: Date; // 过期时间
  priority: CachePriority; // 缓存优先级
  isExpired: boolean; // 是否已过期
}

/**
 * 缓存统计信息
 */
export interface CacheStats {
  totalItems: number; // 总缓存项数
  totalSize: number; // 总缓存大小（字节）
  expiredItems: number; // 已过期项数
  lastUpdated: Date; // 最后更新时间
  byPriority: Record<CachePriority, { count: number; size: number }>; // 按优先级分组的统计
  performance?: {
    // 查询性能统计
    totalQueries: number;
    cacheHits: number;
    cacheMisses: number;
    hitRate: number;
    popularQueries: Array<{ queryKey: QueryKey; hitCount: number }>;
  };
}

/**
 * 持久化策略配置
 */
export interface PersistenceStrategy {
  name: string; // 策略名称
  type: PersistenceStrategyType; // 策略类型
  storageType: StorageType; // 存储类型
  gcTime: number; // 垃圾回收时间（毫秒，v5 中 cacheTime 已重命名为 gcTime）
  maxSize?: number; // 最大存储大小（字节）
  compress?: boolean; // 是否压缩数据
  queryKeyFilter?: (queryKey: QueryKey) => boolean; // 查询键过滤器
  serializer?: DataSerializer; // 数据序列化器
  deserializer?: DataDeserializer; // 数据反序列化器
  shouldDehydrateQuery?: (queryKey: QueryKey) => boolean; // 是否应该持久化查询
  shouldDehydrateMutation?: (mutationKey: QueryKey) => boolean; // 是否应该持久化变更
  config?: Record<string, unknown>; // 自定义配置
}

/**
 * 持久化配置
 */
export interface PersistenceConfig {
  enabled: boolean; // 是否启用持久化
  keyPrefix: string; // 存储键前缀
  strategy: PersistenceStrategy; // 持久化策略
  maxRetries: number; // 最大重试次数
  retryDelay: number; // 重试延迟（毫秒）
  debug: boolean; // 是否启用调试模式
  storage?: Storage; // 自定义存储适配器
}

/**
 * 持久化事件类型枚举
 */
export enum PersistenceEventType {
  SAVE_START = "save_start",
  SAVE_SUCCESS = "save_success",
  SAVE_ERROR = "save_error",
  LOAD_START = "load_start",
  LOAD_SUCCESS = "load_success",
  LOAD_ERROR = "load_error",
  CLEANUP_START = "cleanup_start",
  CLEANUP_SUCCESS = "cleanup_success",
  CLEANUP_ERROR = "cleanup_error"
}

/**
 * 持久化事件数据
 */
export interface PersistenceEventData {
  type: PersistenceEventType; // 事件类型
  timestamp: Date; // 时间戳
  data?: unknown; // 相关数据
  error?: Error; // 错误信息
  metadata?: Record<string, unknown>; // 元数据
}

/**
 * 持久化事件监听器
 */
export type PersistenceEventListener = (event: PersistenceEventData) => void;

/**
 * 持久化回调函数
 */
export interface PersistenceCallbacks {
  onBeforeSave?: (data: unknown) => void | Promise<void>; // 保存前回调
  onAfterSave?: (data: unknown) => void | Promise<void>; // 保存后回调
  onBeforeLoad?: () => void | Promise<void>; // 加载前回调
  onAfterLoad?: (data: unknown) => void | Promise<void>; // 加载后回调
  onError?: (error: Error) => void | Promise<void>; // 错误回调
}

/**
 * 缓存操作结果
 */
export interface CacheOperationResult<T = unknown> extends OperationResult<T> {
  operation: "save" | "load" | "delete" | "cleanup"; // 操作类型
  affectedItems?: number; // 影响的缓存项数量
  freedSpace?: number; // 释放的空间大小（字节）
}

/**
 * 导出操作结果
 */
export interface ExportOperationResult extends OperationResult<string> {
  exportSize: number; // 导出的数据大小（字节）
  exportedItems: number; // 导出的缓存项数量
  format: "json" | "binary"; // 导出格式
}

/**
 * 持久化提供者选项
 */
export interface PersistenceProviderOptions {
  config: PersistenceConfig; // 持久化配置
  callbacks?: PersistenceCallbacks; // 事件回调
  children: React.ReactNode; // 子组件
}

/**
 * Hook 选项
 */
export interface HookOptions {
  enabled?: boolean; // 是否启用
  retry?: boolean | number; // 重试配置
  onError?: (error: Error) => void; // 错误回调
  onSuccess?: (data: unknown) => void; // 成功回调
}
