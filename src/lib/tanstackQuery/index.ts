/**
 * TanStack Query 增强库 - 主入口
 *
 * 功能模块：
 * - components: React 组件（错误边界、加载占位、Suspense 包装等）
 * - core: 核心配置（QueryClient 配置、开发工具、键管理等）
 * - hooks: React Hooks（查询、变更、预取、批量查询等）
 * - types: TypeScript 类型定义
 * - utils: 工具函数
 * - features: 可选功能（persistence 持久化、offline 离线支持）
 *
 * @see {@link ../../../docs/tanstack-query-usage.md} 完整使用示例和最佳实践
 */

// ==================== 组件导出 ====================
export * from "./components";

// ==================== 核心功能导出 ====================
export * from "./core";

// ==================== Hooks 导出 ====================
export * from "./hooks";

// 直接导出顶层的 PersistQueryClientProvider（避免依赖组件入口）
export { PersistQueryClientProvider, type PersistQueryClientProviderProps } from "./PersistQueryClientProvider";

// ==================== 类型导出 ====================
export type {
  BatchErrorAggregate,
  BatchOperationReport,
  BatchQueryConfig,
  BatchQueryOperations,
  // 批量查询类型
  BatchQueryResult,
  BatchQueryStats,
  BatchRetryConfig,
  CacheItemInfo,
  CacheOperationResult,
  CachePriority,
  CacheStats,
  ConnectionQuality,
  // 无限查询类型
  CursorPaginatedResponse,
  DeepReadonly,
  EnhancedBatchQueryResult,
  EnhancedSuspenseInfiniteQueryOptions,
  EnhancedSuspenseInfiniteQueryResult,
  // Suspense 类型
  EnhancedSuspenseQueryOptions,
  EnhancedSuspenseQueryResult,
  // 选择器类型
  EntityWithId,
  ErrorBoundaryProps,
  ErrorBoundaryState,
  ErrorFallbackProps,
  ExportOperationResult,
  ListOperationConfig,
  ListOperationType,
  ListUpdater,
  LoadingFallbackProps,

  // Mutation 类型
  MutationContext,
  MutationOperationType,
  MutationOptions,
  NetworkInformation,
  NetworkStatus,
  OfflineManagerConfig,
  OfflineMutationOperation,
  OfflineMutationOptions,
  OfflineQueryInfo,
  OfflineQueryOptions,
  OfflineQueueConfig,

  // 离线类型
  OfflineRecoveryConfig,
  OfflineState,
  OffsetPaginatedResponse,
  OperationResult,
  OptimisticContext,
  OptimisticGlobalConfig,
  OptimisticOperationTypeValue,
  // 乐观更新类型
  OptimisticUpdateConfig,
  OptimisticUpdater,
  Optional,
  PageNumberPaginatedResponse,
  PaginatedResponseWithMeta,
  PaginationMeta,
  PaginationParams,
  PersistenceCallbacks,
  // 持久化类型
  PersistenceConfig,
  PersistenceEventData,
  PersistenceEventListener,
  PersistenceEventType,
  PersistenceStrategy,
  PersistenceStrategyType,
  QueryMetadata,
  QueryStatus,
  RollbackFunction,
  StorageInfo,
  // 基础类型
  StorageType,
  SuspenseConfig,
  SuspenseInfiniteQueryFunction,
  SuspenseQueryFunction,
  SuspenseWrapperProps
} from "./types";

// ==================== 工具函数导出 ====================
export * from "./utils";

// ==================== 重新导出 TanStack Query 核心 API ====================
export {
  QueryClient, // 查询客户端
  QueryClientProvider, // 查询客户端提供者
  skipToken, // 条件查询令牌（类型安全的查询跳过）
  useQueryClient // 获取查询客户端的 Hook
} from "@tanstack/react-query";

// ==================== 可选功能（不默认导出，按需导入） ====================
// 注意：为了减少 bundle size，persistence 和 offline 功能不再默认导出
// 如需使用，请按需导入：
// import { createPersister } from '@/lib/tanstackQuery/features/persistence';
// import { createOfflineQueueManager } from '@/lib/tanstackQuery/features/offline';
