/**
 * 存储工具
 *
 * 功能：提供统一的存储操作接口
 */

import type { StorageInfo } from "../types/persistence";
import { StorageType } from "../types/base";

/**
 * 根据存储类型获取存储对象
 * @param storageType - 存储类型
 * @returns 存储对象或 null
 */
function getStorageByType(storageType: StorageType): Storage | null {
  try {
    switch (storageType) {
      case StorageType.LOCAL:
        return typeof window !== "undefined" ? window.localStorage : null;
      case StorageType.SESSION:
        return typeof window !== "undefined" ? window.sessionStorage : null;
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/**
 * 检查存储是否可用
 * @param {StorageType} storageType - 存储类型
 * @returns {boolean} 是否可用
 */
export function isStorageAvailable(storageType: StorageType): boolean {
  try {
    const storage = getStorageByType(storageType);
    if (!storage) {
      return false;
    }

    const testKey = "__storage_test__";
    storage.setItem(testKey, "test");
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取存储使用信息
 * @param {StorageType} storageType - 存储类型
 * @returns {StorageInfo} 存储使用信息
 */
export function getStorageUsage(storageType: StorageType): StorageInfo {
  try {
    const storage = getStorageByType(storageType);
    if (!storage) {
      return {
        type: storageType,
        used: 0,
        total: 0,
        usage: 0,
        available: false,
        error: "Storage not available"
      };
    }

    let used = 0;
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key) {
        const value = storage.getItem(key);
        if (value) {
          used += key.length + value.length;
        }
      }
    }

    // 估算总容量（localStorage通常为5-10MB）
    const total = storageType === StorageType.LOCAL ? 5 * 1024 * 1024 : 5 * 1024 * 1024;

    return {
      type: storageType,
      used,
      total,
      usage: used / total,
      available: true
    };
  } catch (error) {
    return {
      type: storageType,
      used: 0,
      total: 0,
      usage: 0,
      available: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * 格式化字节大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的字符串
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "0 Bytes";
  }

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * 深度克隆对象
 * @template T
 * @param {T} obj - 要克隆的对象
 * @returns {T} 克隆后的对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as T;
  }
  if (typeof obj === "object") {
    const cloned = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  return obj;
}
