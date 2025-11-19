/**
 * 功能特性统一导出
 * 导出所有功能特性模块，支持 tree-shaking
 *
 * @note 乐观更新功能已合并到 hooks/useMutation.ts
 */

// 乐观更新相关工具函数：直接从 hooks/useMutation 导出（移除对废弃模块的转发）
export { cancelQueriesBatch, invalidateQueriesBatch, setQueryDataBatch } from "../hooks/useMutation";

// 离线功能
export {
  calculateExponentialBackoff,
  configureOfflineQueries,
  createOfflineQueueManager,
  isOnline,
  mutationRegistry,
  OfflineQueueManager,
  setupOnlineManager,
  subscribeToOnlineStatus
} from "./offline";

// 持久化功能
export {
  checkStorageSize,
  clearCache,
  clearExpiredCache,
  createPersister,
  createPersistOptions,
  getStorageStats,
  migrateToIndexedDB,
  type PersistedClient,
  type Persister,
  type PersistOptions
} from "./persistence";
