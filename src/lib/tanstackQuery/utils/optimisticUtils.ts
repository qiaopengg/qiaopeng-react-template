/**
 * 乐观更新工具
 * 提供列表的增删改等乐观更新操作
 *
 * @see {@link ../../../docs/tanstack-query-usage.md} 使用示例
 */

import type { QueryKey } from "@tanstack/react-query";

import type { ListOperationConfig, OptimisticUpdateConfig } from "../types/optimistic";
import type { EntityWithId } from "../types/selectors";
import { ListOperationType } from "../types/optimistic";

/**
 * 列表更新器 - 提供标准的列表操作方法
 */
export const listUpdater = {
  /**
   * 添加项目到列表
   * @param items - 当前列表
   * @param newItem - 新项目
   * @returns 更新后的列表
   */
  add: <T extends EntityWithId>(items: T[] | undefined, newItem: T): T[] => {
    const currentItems = items || [];
    // 检查是否已存在相同 ID 的项目
    const existingIndex = currentItems.findIndex((item) => item.id === newItem.id);
    if (existingIndex >= 0) {
      // 如果存在，替换现有项目
      const updatedItems = [...currentItems];
      updatedItems[existingIndex] = newItem;
      return updatedItems;
    }
    // 如果不存在，添加到列表开头
    return [newItem, ...currentItems];
  },

  /**
   * 更新列表中的项目
   * @param items - 当前列表
   * @param updatedItem - 更新的项目（包含 id 和部分字段）
   * @returns 更新后的列表
   */
  update: <T extends EntityWithId>(items: T[] | undefined, updatedItem: Partial<T> & { id: T["id"] }): T[] => {
    const currentItems = items || [];
    return currentItems.map((item) => (item.id === updatedItem.id ? { ...item, ...updatedItem } : item));
  },

  /**
   * 从列表中移除项目
   * @param items - 当前列表
   * @param itemId - 要移除的项目 ID
   * @returns 更新后的列表
   */
  remove: <T extends EntityWithId>(items: T[] | undefined, itemId: T["id"]): T[] => {
    const currentItems = items || [];
    return currentItems.filter((item) => item.id !== itemId);
  }
};

// ==================== 乐观更新配置生成器 ====================

/**
 * 创建添加项目的乐观更新配置
 * @template T
 * @param {QueryKey} queryKey - 查询键
 * @param {object} [options] - 可选配置
 * @param {boolean} [options.addToTop] - 是否添加到列表开头
 * @param {(error: Error) => void} [options.onRollback] - 自定义回滚逻辑
 * @returns {OptimisticUpdateConfig<T[], T>} 乐观更新配置
 */
export function createAddItemConfig<T extends EntityWithId>(
  queryKey: QueryKey,
  options?: {
    /** 是否添加到列表开头 */
    addToTop?: boolean;
    /** 自定义回滚逻辑 */
    onRollback?: (error: Error) => void;
  }
): OptimisticUpdateConfig<T[], T> {
  return {
    queryKey,
    updater: (oldData: T[] | undefined, newItem: T) => {
      const currentItems = oldData || [];
      if (options?.addToTop !== false) {
        return [newItem, ...currentItems];
      }
      return [...currentItems, newItem];
    },
    rollback: options?.onRollback
      ? (_previousData: T[], error: Error) => {
          options.onRollback!(error);
        }
      : undefined,
    enabled: true
  };
}

/**
 * 创建更新项目的乐观更新配置
 * @param queryKey - 查询键
 * @param options - 可选配置
 * @param options.onRollback - 自定义回滚逻辑
 * @returns 乐观更新配置
 */
export function createUpdateItemConfig<T extends EntityWithId>(
  queryKey: QueryKey,
  options?: {
    /** 自定义回滚逻辑 */
    onRollback?: (error: Error) => void;
  }
): OptimisticUpdateConfig<T[], Partial<T> & { id: T["id"] }> {
  return {
    queryKey,
    updater: (oldData: T[] | undefined, updatedItem: Partial<T> & { id: T["id"] }) => {
      return listUpdater.update(oldData, updatedItem);
    },
    rollback: options?.onRollback
      ? (_previousData: T[], error: Error) => {
          options.onRollback!(error);
        }
      : undefined,
    enabled: true
  };
}

/**
 * 创建删除项目的乐观更新配置
 * @param queryKey - 查询键
 * @param options - 可选配置
 * @param options.onRollback - 自定义回滚逻辑
 * @returns 乐观更新配置
 */
export function createRemoveItemConfig<T extends EntityWithId>(
  queryKey: QueryKey,
  options?: {
    /** 自定义回滚逻辑 */
    onRollback?: (error: Error) => void;
  }
): OptimisticUpdateConfig<T[], T["id"]> {
  return {
    queryKey,
    updater: (oldData: T[] | undefined, itemId: T["id"]) => {
      return listUpdater.remove(oldData, itemId);
    },
    rollback: options?.onRollback
      ? (_previousData: T[], error: Error) => {
          options.onRollback!(error);
        }
      : undefined,
    enabled: true
  };
}

// ==================== 通用列表操作 ====================

/**
 * 列表操作变量类型 - 根据操作类型确定变量类型
 */
export type ListOperationVariables<
  T extends EntityWithId,
  TOperation extends ListOperationType
> = TOperation extends ListOperationType.ADD
  ? T
  : TOperation extends ListOperationType.UPDATE
    ? Partial<T> & { id: T["id"] }
    : TOperation extends ListOperationType.REMOVE
      ? T["id"]
      : never;

/**
 * 创建通用列表操作配置
 * @param config - 列表操作配置
 * @returns 乐观更新配置
 */
export function createListOperationConfig<
  T extends EntityWithId,
  TOperation extends ListOperationType = ListOperationType
>(config: ListOperationConfig<T>): OptimisticUpdateConfig<T[], ListOperationVariables<T, TOperation>> {
  return {
    queryKey: config.queryKey,
    updater: (oldData: T[] | undefined, variables: ListOperationVariables<T, TOperation>) => {
      switch (config.operation) {
        case ListOperationType.ADD:
          return listUpdater.add(oldData, variables as T);
        case ListOperationType.UPDATE:
          return listUpdater.update(oldData, variables as Partial<T> & { id: T["id"] });
        case ListOperationType.REMOVE:
          return listUpdater.remove(oldData, variables as T["id"]);
        default:
          return oldData || [];
      }
    },
    rollback: config.onRollback
      ? (previousData: T[], error: Error) => {
          config.onRollback!(error, { previousData, timestamp: Date.now(), operationType: "update" });
        }
      : undefined,
    enabled: true
  };
}

// ==================== 高级工具函数 ====================

/**
 * 批量更新列表项目
 * @template T
 * @param {T[] | undefined | null} items - 当前列表
 * @param {Array<Partial<T> & { id: T["id"] }>} updates - 更新项目数组
 * @returns {T[]} 更新后的列表
 */
export function batchUpdateItems<T extends EntityWithId>(
  items: T[] | undefined | null,
  updates: Array<Partial<T> & { id: T["id"] }>
): T[] {
  let currentItems = items || [];

  updates.forEach((update) => {
    currentItems = listUpdater.update(currentItems, update);
  });

  return currentItems;
}

/**
 * 批量删除列表项目
 * @param items - 当前列表
 * @param itemIds - 要删除的项目 ID 数组
 * @returns 更新后的列表
 */
export function batchRemoveItems<T extends EntityWithId>(items: T[] | undefined | null, itemIds: Array<T["id"]>): T[] {
  let currentItems = items || [];

  itemIds.forEach((itemId) => {
    currentItems = listUpdater.remove(currentItems, itemId);
  });

  return currentItems;
}

/**
 * 重新排序列表项目
 * @param items - 当前列表
 * @param fromIndex - 源索引
 * @param toIndex - 目标索引
 * @returns 重新排序后的列表
 */
export function reorderItems<T extends EntityWithId>(
  items: T[] | undefined | null,
  fromIndex: number,
  toIndex: number
): T[] {
  const currentItems = [...(items || [])];

  if (fromIndex < 0 || fromIndex >= currentItems.length || toIndex < 0 || toIndex >= currentItems.length) {
    return currentItems;
  }

  const [movedItem] = currentItems.splice(fromIndex, 1);
  currentItems.splice(toIndex, 0, movedItem);

  return currentItems;
}

/**
 * 根据条件过滤并更新列表
 * @param items - 当前列表
 * @param predicate - 过滤条件
 * @param updater - 更新函数
 * @returns 更新后的列表
 */
export function conditionalUpdateItems<T extends EntityWithId>(
  items: T[] | undefined | null,
  predicate: (item: T) => boolean,
  updater: (item: T) => Partial<T>
): T[] {
  const currentItems = items || [];

  return currentItems.map((item) => {
    if (predicate(item)) {
      return { ...item, ...updater(item) };
    }
    return item;
  });
}
