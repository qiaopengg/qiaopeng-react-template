/**
 * 持久化功能
 * 提供查询缓存的持久化能力,支持 localStorage 和 IndexedDB
 */

import type { Query } from "@tanstack/react-query";
import type { PersistedClient, Persister } from "@tanstack/react-query-persist-client";

/**
 * 检查数据是否可序列化
 *
 * @param {unknown} data - 要检查的数据
 * @returns {boolean} 是否可序列化
 */
function isSerializable(data: unknown): boolean {
  try {
    JSON.stringify(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * 处理存储配额超出错误
 * 尝试清理缓存释放空间
 *
 * @param {unknown} error - 错误对象
 * @param {string} key - 存储键名
 */
function handleStorageQuotaError(error: unknown, key: string): void {
  if (error instanceof Error && error.name === "QuotaExceededError") {
    console.error(
      `[Persistence] Storage quota exceeded for key "${key}". Consider clearing old cache or using IndexedDB.`
    );
    // 尝试清理缓存
    try {
      window.localStorage.removeItem(key);
      console.info(`[Persistence] Cleared cache for key "${key}" to free up space.`);
    } catch (clearError) {
      console.error(`[Persistence] Failed to clear cache:`, clearError);
    }
  } else {
    console.error(`[Persistence] Storage error:`, error);
  }
}

/**
 * 创建带错误处理的存储包装器
 * 自动捕获和处理存储错误
 *
 * @param {Storage} storage - 原始存储对象
 * @param {string} key - 存储键名
 * @returns {Storage} 包装后的存储对象
 */
function createSafeStorage(storage: Storage, key: string): Storage {
  return {
    getItem: (storageKey: string) => {
      try {
        return storage.getItem(storageKey);
      } catch (error) {
        console.error(`[Persistence] Failed to get item from storage:`, error);
        return null;
      }
    },
    setItem: (storageKey: string, value: string) => {
      try {
        storage.setItem(storageKey, value);
      } catch (error) {
        handleStorageQuotaError(error, key);
      }
    },
    removeItem: (storageKey: string) => {
      try {
        storage.removeItem(storageKey);
      } catch (error) {
        console.error(`[Persistence] Failed to remove item from storage:`, error);
      }
    },
    clear: () => {
      try {
        storage.clear();
      } catch (error) {
        console.error(`[Persistence] Failed to clear storage:`, error);
      }
    },
    key: (index: number) => {
      try {
        return storage.key(index);
      } catch (error) {
        console.error(`[Persistence] Failed to get key from storage:`, error);
        return null;
      }
    },
    get length() {
      try {
        return storage.length;
      } catch (error) {
        console.error(`[Persistence] Failed to get storage length:`, error);
        return 0;
      }
    }
  };
}

// 废弃函数已移除，请使用 createPersister

// ==================== 持久化选项配置 ====================

/**
 * 持久化选项配置
 * @property {number} [maxAge] - 最大缓存时间（毫秒）
 * @property {boolean} [onlyPersistSuccess] - 是否只持久化成功的查询
 * @property {object} [dehydrateOptions] - 自定义 dehydrate 选项
 */
export interface PersistOptions {
  maxAge?: number;
  onlyPersistSuccess?: boolean;
  dehydrateOptions?: {
    shouldDehydrateQuery?: (query: Query) => boolean;
  };
}

/**
 * 创建默认的持久化选项
 * 配置缓存时间和序列化规则
 *
 * @param {Partial<PersistOptions>} [config] - 持久化配置
 * @returns {object} 持久化选项对象
 */
export function createPersistOptions(config: Partial<PersistOptions> = {}): {
  maxAge: number;
  dehydrateOptions?: {
    shouldDehydrateQuery?: (query: Query) => boolean;
  };
} {
  const {
    maxAge = 1000 * 60 * 60 * 24, // 24 小时
    onlyPersistSuccess = true,
    dehydrateOptions
  } = config;

  return {
    maxAge,
    dehydrateOptions: {
      ...dehydrateOptions,
      shouldDehydrateQuery:
        dehydrateOptions?.shouldDehydrateQuery ||
        (onlyPersistSuccess
          ? (query: Query) => {
              // 只持久化成功的查询
              if (query.state.status !== "success") {
                return false;
              }

              // 检查数据是否可序列化
              if (!isSerializable(query.state.data)) {
                console.warn(`[Persistence] Query data not serializable, skipping:`, query.queryKey);
                return false;
              }

              return true;
            }
          : undefined)
    }
  };
}

/**
 * 创建持久化器（带完整错误处理）
 * 推荐方式，自动处理环境检查和错误
 *
 * @param {string} [storageKey] - 存储键名
 * @param {Storage} [storage] - 可选的自定义存储对象
 * @returns {Persister | undefined} Persister 实例或 undefined（如果环境不支持）
 */
export function createPersister(storageKey = "tanstack-query-cache", storage?: Storage): Persister | undefined {
  if (typeof window === "undefined") {
    console.warn("[Persistence] Not in browser environment, persistence disabled");
    return undefined;
  }

  const targetStorage = storage || window.localStorage;

  if (!targetStorage) {
    console.warn("[Persistence] Storage not available, persistence disabled");
    return undefined;
  }

  try {
    const safeStorage = createSafeStorage(targetStorage, storageKey);

    const persister: Persister = {
      persistClient: async (client: PersistedClient) => {
        try {
          safeStorage.setItem(storageKey, JSON.stringify(client));
        } catch (error) {
          console.error("[Persistence] Failed to persist client:", error);
        }
      },
      restoreClient: async () => {
        try {
          const raw = safeStorage.getItem(storageKey);
          return raw ? (JSON.parse(raw) as PersistedClient) : undefined;
        } catch (error) {
          console.error("[Persistence] Failed to restore client:", error);
          return undefined;
        }
      },
      removeClient: async () => {
        try {
          safeStorage.removeItem(storageKey);
        } catch (error) {
          console.error("[Persistence] Failed to remove client:", error);
        }
      }
    };

    return persister;
  } catch (error) {
    console.error("[Persistence] Failed to create persister:", error);
    return undefined;
  }
}

/** 推荐使用 PersistQueryClientProvider 组件进行持久化 */

/**
 * 清理缓存
 * 从 localStorage 移除指定键的缓存
 *
 * @param {string} [key] - 存储键名
 */
export function clearCache(key = "tanstack-query-cache"): void {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn("[Persistence] Failed to clear cache:", error);
  }
}

/**
 * 清理过期的缓存条目
 * 检查并移除超过最大缓存时间的数据
 *
 * @param {string} [key] - 存储键名
 * @param {number} [maxAge] - 最大缓存时间（毫秒，默认 24 小时）
 */
export function clearExpiredCache(key = "tanstack-query-cache", maxAge = 1000 * 60 * 60 * 24): void {
  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) return;

    const parsed = JSON.parse(stored) as PersistedClient;
    const now = Date.now();

    // 检查是否过期
    if (parsed.timestamp && now - parsed.timestamp > maxAge) {
      window.localStorage.removeItem(key);
      console.info(`[Persistence] Cleared expired cache for key "${key}"`);
    }
  } catch (error) {
    console.warn("[Persistence] Failed to clear expired cache:", error);
  }
}

// ==================== 迁移工具 ====================

/**
 * 从 localStorage 迁移到 IndexedDB
 * 当缓存数据量较大时使用
 *
 * @param {string} [localStorageKey] - localStorage 中的键名
 * @param {string} [indexedDBKey] - IndexedDB 中的键名
 * @param {Storage | { setItem: (key: string, value: string) => Promise<void> }} indexedDBStorage - IndexedDB 存储实例（支持同步或异步）
 * @returns {Promise<boolean>} 迁移是否成功
 */
export async function migrateToIndexedDB(
  localStorageKey = "tanstack-query-cache",
  indexedDBKey = "tanstack-query-cache",
  indexedDBStorage: Storage | { setItem: (key: string, value: string) => Promise<void> }
): Promise<boolean> {
  try {
    // 检查 localStorage 中是否有数据
    const localData = window.localStorage.getItem(localStorageKey);
    if (!localData) {
      console.info("[Persistence] No data to migrate from localStorage");
      return true;
    }

    // 验证数据格式
    const parsed = JSON.parse(localData) as PersistedClient;
    if (!parsed.clientState) {
      console.warn("[Persistence] Invalid cache data format");
      return false;
    }

    // 写入 IndexedDB（支持同步和异步）
    const setItemResult = indexedDBStorage.setItem(indexedDBKey, localData);
    if (setItemResult instanceof Promise) {
      await setItemResult;
    }
    console.info("[Persistence] Successfully migrated cache to IndexedDB");

    // 清理 localStorage
    window.localStorage.removeItem(localStorageKey);
    console.info("[Persistence] Cleaned up localStorage cache");

    return true;
  } catch (error) {
    console.error("[Persistence] Failed to migrate to IndexedDB:", error);
    return false;
  }
}

/**
 * 检查存储大小并建议迁移
 * 超过 5MB 建议迁移到 IndexedDB
 *
 * @param {string} [key] - 存储键名
 * @returns {object} 存储信息和迁移建议
 */
export function checkStorageSize(key = "tanstack-query-cache"): {
  sizeInBytes: number;
  sizeInMB: number;
  shouldMigrate: boolean;
  message: string;
} {
  try {
    const data = window.localStorage.getItem(key);
    if (!data) {
      return {
        sizeInBytes: 0,
        sizeInMB: 0,
        shouldMigrate: false,
        message: "No cache data found"
      };
    }

    const sizeInBytes = new Blob([data]).size;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    const shouldMigrate = sizeInMB > 5; // 超过 5MB 建议迁移

    return {
      sizeInBytes,
      sizeInMB: Math.round(sizeInMB * 100) / 100,
      shouldMigrate,
      message: shouldMigrate
        ? `Cache size (${sizeInMB.toFixed(2)}MB) exceeds recommended limit. Consider migrating to IndexedDB.`
        : `Cache size (${sizeInMB.toFixed(2)}MB) is within acceptable range.`
    };
  } catch (error) {
    console.error("[Persistence] Failed to check storage size:", error);
    return {
      sizeInBytes: 0,
      sizeInMB: 0,
      shouldMigrate: false,
      message: "Failed to check storage size"
    };
  }
}

/**
 * 获取存储统计信息
 * 包含缓存年龄、查询数量、大小等
 *
 * @param {string} [key] - 存储键名
 * @returns {object} 存储统计信息
 */
export function getStorageStats(key = "tanstack-query-cache"): {
  exists: boolean;
  age?: number;
  queriesCount?: number;
  mutationsCount?: number;
  sizeInfo: ReturnType<typeof checkStorageSize>;
} {
  try {
    const data = window.localStorage.getItem(key);
    if (!data) {
      return {
        exists: false,
        sizeInfo: checkStorageSize(key)
      };
    }

    const parsed = JSON.parse(data) as PersistedClient;
    const now = Date.now();
    const age = parsed.timestamp ? now - parsed.timestamp : undefined;

    return {
      exists: true,
      age,
      queriesCount: parsed.clientState?.queries?.length,
      mutationsCount: parsed.clientState?.mutations?.length,
      sizeInfo: checkStorageSize(key)
    };
  } catch (error) {
    console.error("[Persistence] Failed to get storage stats:", error);
    return {
      exists: false,
      sizeInfo: checkStorageSize(key)
    };
  }
}

// ==================== 类型导出 ====================

/** 持久化相关类型 */
export type { PersistedClient, Persister };
