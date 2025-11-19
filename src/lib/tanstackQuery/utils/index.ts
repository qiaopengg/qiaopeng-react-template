/**
 * 工具函数统一导出
 *
 * 功能：统一导出所有工具函数
 * 使用具名导出以支持 tree-shaking
 */

// 字段映射工具
export { createFieldEnricher, createOptimisticBase, createTempId, type FieldMappingConfig } from "./fieldMapper";

// 网络相关工具
export { getNetworkInfo, getNetworkSpeed, isFastNetwork, isSlowNetwork, type NavigatorWithConnection } from "./network";

// 乐观更新工具
export {
  batchRemoveItems,
  batchUpdateItems,
  conditionalUpdateItems,
  createAddItemConfig,
  createListOperationConfig,
  createRemoveItemConfig,
  createUpdateItemConfig,
  type ListOperationVariables,
  listUpdater,
  reorderItems
} from "./optimisticUtils";

// 占位数据工具
export { keepPreviousData } from "./placeholderData";

// 预取管理器
export {
  getPrefetchManager,
  type InteractionRecord,
  type NetworkSpeed,
  type PredictionResult,
  type PrefetchConfig,
  type PrefetchStats,
  type PrefetchTask,
  resetPrefetchManager,
  SmartPrefetchManager
} from "./prefetchManager";

// Query Key 工具（按名称字母序排序导出）
export {
  createQueryKeyFactory,
  createSimpleQueryKeyFactory,
  extractParamsFromKey,
  isQueryKeyEqual,
  type NormalizeConfig,
  normalizeQueryParams,
  type QueryKeyFactory,
  type QueryKeyFactoryConfig
} from "./queryKey";

// 选择器工具
export {
  compose,
  selectById,
  selectByIds,
  selectCount,
  selectField,
  selectFields,
  selectFirst,
  selectItems,
  selectLast,
  selectMap,
  selectors,
  selectTotal,
  selectWhere
} from "./selectors";

// 存储相关工具
export { deepClone, formatBytes, getStorageUsage, isStorageAvailable } from "./storage";
