/**
 * 查询数据选择器工具
 * 提供数据选择和转换的工具函数
 */

import type { EntityWithId, PaginatedData } from "../types/selectors";

/**
 * 从列表中选择特定 ID 的项
 * @template T
 * @param {T["id"]} id - 项目 ID
 * @returns {(data: T[] | undefined) => T | undefined} 选择器函数
 */
export function selectById<T extends EntityWithId>(id: T["id"]) {
  return (data: T[] | undefined): T | undefined => {
    return data?.find((item) => item.id === id);
  };
}

/**
 * 从列表中选择多个 ID 的项
 * @template T
 * @param {T["id"][]} ids - 项目 ID 数组
 * @returns {(data: T[] | undefined) => T[]} 选择器函数
 */
export function selectByIds<T extends EntityWithId>(ids: T["id"][]) {
  return (data: T[] | undefined): T[] => {
    if (!data) return [];
    return data.filter((item) => ids.includes(item.id));
  };
}

/** 选择列表的第一项 */
export function selectFirst<T>(data: T[] | undefined): T | undefined {
  return data?.[0];
}

/** 选择列表的最后一项 */
export function selectLast<T>(data: T[] | undefined): T | undefined {
  if (!data || data.length === 0) return undefined;
  return data[data.length - 1];
}

/** 选择列表的长度 */
export function selectCount<T>(data: T[] | undefined): number {
  return data?.length ?? 0;
}

/** 选择分页数据的总数 */
export function selectTotal<T extends { total?: number }>(data: T | undefined): number {
  return data?.total ?? 0;
}

/** 选择分页数据的项目列表 */
export function selectItems<TItem, T extends PaginatedData<TItem>>(data: T | undefined): TItem[] {
  return data?.items ?? [];
}

/** 根据条件过滤列表 */
export function selectWhere<T>(predicate: (item: T) => boolean) {
  return (data: T[] | undefined): T[] => {
    if (!data) return [];
    return data.filter(predicate);
  };
}

/** 映射列表项 */
export function selectMap<T, R>(mapper: (item: T) => R) {
  return (data: T[] | undefined): R[] => {
    if (!data) return [];
    return data.map(mapper);
  };
}

/** 选择特定字段 */
export function selectField<T, K extends keyof T>(field: K) {
  return (data: T | undefined): T[K] | undefined => {
    return data?.[field];
  };
}

/** 选择多个字段 */
export function selectFields<T, K extends keyof T>(fields: K[]) {
  return (data: T | undefined): Pick<T, K> | undefined => {
    if (!data) return undefined;
    const result = {} as Pick<T, K>;
    fields.forEach((field) => {
      result[field] = data[field];
    });
    return result;
  };
}

/** 组合多个选择器 */
export function compose<T, R1, R2>(selector1: (data: T) => R1, selector2: (data: R1) => R2) {
  return (data: T): R2 => {
    return selector2(selector1(data));
  };
}

/** 选择器工具对象 */
export const selectors = {
  byId: selectById,
  byIds: selectByIds,
  first: selectFirst,
  last: selectLast,
  count: selectCount,
  total: selectTotal,
  items: selectItems,
  where: selectWhere,
  map: selectMap,
  field: selectField,
  fields: selectFields,
  compose
};
