/**
 * 核心功能统一导出
 * 导出所有核心功能模块，支持 tree-shaking
 */

// 配置相关
export {
  createCustomConfig,
  DEFAULT_GC_TIME,
  DEFAULT_MUTATION_CONFIG,
  DEFAULT_QUERY_CONFIG,
  DEFAULT_STALE_TIME,
  defaultMutationRetryStrategy,
  defaultQueryRetryStrategy,
  DEVELOPMENT_CONFIG,
  ensureBestPractices,
  exponentialBackoff,
  getConfigByEnvironment,
  GLOBAL_QUERY_CONFIG,
  LONG_CACHE_CONFIG,
  PRODUCTION_CONFIG,
  REALTIME_CONFIG,
  SMART_RETRY_MUTATION_CONFIG,
  TIME_CONSTANTS,
  validateConfig,
  validateGcTime
} from "./config";

// DevTools
export {
  createDevToolsConfig,
  defaultDevToolsConfig,
  type DevToolsConfig,
  isDevToolsEnabled,
  ReactQueryDevtools
} from "./devtools";

// 焦点管理
export {
  focusManager,
  type FocusManagerConfig,
  getSmartFocusManager,
  pauseFocusManager,
  resetSmartFocusManager,
  resumeFocusManager,
  setupFocusManager,
  SmartFocusManager
} from "./focusManager";

// 查询键管理
export {
  areKeysEqual,
  containsEntity,
  createComplexKey,
  createDomainKeyFactory,
  createFilteredKey,
  createMutationKeyFactory,
  createPaginatedKey,
  createSearchKey,
  createSortedKey,
  extractEntityId,
  matchesKeyPattern,
  normalizeQueryKey,
  queryKeys,
  validateQueryKey
} from "./keys";

// 查询选项助手
export { createAppQueryOptions, createAppQueryOptionsWithSelect } from "./queryOptions";
