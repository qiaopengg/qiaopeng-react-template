/**
 * TanStack Query Hooks 统一导出
 * 包含批量查询、焦点管理、Mutation、预取、基础查询、Suspense 查询、无限查询等模块
 */

// 批量查询 Hooks
export {
  batchQueryUtils,
  calculateBatchStats,
  createBatchQueryConfig,
  useAutoRefreshBatchQueries,
  useBatchQueryPerformance,
  useCombinedQueries,
  useConditionalBatchQueries,
  useDashboardQueries,
  useDependentBatchQueries,
  useDynamicBatchQueries,
  useEnhancedQueries,
  useEnhancedSuspenseQueries,
  usePaginatedBatchQueries,
  useRetryBatchQueries
} from "./batchQueries";

// enhancedHooks.ts 已删除，所有功能已合并到 useMutation.ts

// 焦点管理 Hooks
export {
  useConditionalFocusRefetch,
  useFocusCallback,
  useFocusRefetch,
  type UseFocusRefetchOptions,
  useFocusState,
  usePageVisibility,
  usePauseFocus,
  type UsePauseFocusOptions,
  useSmartFocusManager
} from "./useFocusManager";

// 无限查询 Hooks
export {
  createCursorPaginationOptions,
  createOffsetPaginationOptions,
  createPageNumberPaginationOptions,
  useEnhancedInfiniteQuery
} from "./useInfiniteQuery";

// Mutation Hooks（包含所有 mutation 和乐观更新功能）
export {
  cancelQueriesBatch,
  invalidateQueriesBatch,
  type MutationDefaultsConfig,
  type MutationKey,
  setQueryDataBatch,
  setupMutationDefaults,
  useBatchMutation,
  useConditionalOptimisticMutation,
  useListMutation,
  useMutation
} from "./useMutation";

// 预取 Hooks
export {
  type HoverPrefetchOptions,
  type InViewPrefetchOptions,
  type PrefetchOptions,
  useBatchPrefetch,
  useConditionalPrefetch,
  useHoverPrefetch,
  useIdlePrefetch,
  useInViewPrefetch,
  usePeriodicPrefetch,
  usePredictivePrefetch,
  usePriorityPrefetch,
  useRoutePrefetch,
  useSmartPrefetch
} from "./usePrefetch";

// 基础查询 Hooks
export { skipToken, useEnhancedQuery } from "./useQuery";

// Suspense 查询 Hooks
export {
  createSuspenseInfiniteQuery,
  createSuspenseQuery,
  useEnhancedSuspenseInfiniteQuery,
  useEnhancedSuspenseQuery
} from "./useSuspenseQuery";
