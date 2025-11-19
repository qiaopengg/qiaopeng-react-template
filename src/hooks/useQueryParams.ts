/**
 * 通用 URL 查询参数管理 Hook
 *
 * 适用于所有 CRUD 列表页面，提供统一的 URL 状态管理
 */

import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";

/**
 * URL 查询参数配置
 */
export interface QueryParamsConfig<T extends Record<string, any>> {
  /**
   * 默认值配置
   * 用于初始化和类型推断
   */
  defaults: T;

  /**
   * 筛选字段列表
   * 这些字段变化时会自动重置页码到第 1 页
   *
   */
  filterKeys?: (keyof T)[];

  /**
   * URL 中的页码参数名
   * @default 'page'
   */
  pageKey?: string;

  /**
   * URL 中的每页数量参数名
   * @default 'pageSize'
   */
  pageSizeKey?: string;

  /**
   * 页码字段在 params 对象中的键名
   * @default 'currentPage'
   */
  pageFieldName?: keyof T;

  /**
   * 每页数量字段在 params 对象中的键名
   * @default 'pageSize'
   */
  pageSizeFieldName?: keyof T;
}

/**
 * 更新参数选项
 */
export interface UpdateParamsOptions {
  /**
   * 是否强制重置页码
   * @default false
   */
  resetPage?: boolean;

  /**
   * 是否使用 replace 模式（不产生历史记录）
   * @default true
   */
  replace?: boolean;
}

/**
 * 通用 URL 查询参数管理 Hook
 *
 * 特性：
 * - URL 作为单一数据源
 * - 自动类型转换（根据默认值类型）
 * - 筛选条件变化自动重置页码
 * - 支持自定义 URL 参数名映射
 * - 状态可刷新、可分享
 *
 * @param config - 配置对象
 * @returns { params, updateParams } - 参数对象和更新方法
 */
export function useQueryParams<T extends Record<string, any>>(config: QueryParamsConfig<T>) {
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    defaults,
    filterKeys = [],
    pageKey = "page",
    pageSizeKey = "pageSize",
    pageFieldName = "currentPage" as keyof T,
    pageSizeFieldName = "pageSize" as keyof T
  } = config;

  /**
   * 从 URL 读取参数（单一数据源）
   */
  const params = useMemo<T>(() => {
    const result = { ...defaults };

    // 遍历所有默认值字段
    Object.keys(defaults).forEach((key) => {
      const typedKey = key as keyof T;
      const defaultValue = defaults[typedKey];

      // 处理页码字段的特殊映射
      let urlKey = key;
      if (typedKey === pageFieldName) {
        urlKey = pageKey;
      } else if (typedKey === pageSizeFieldName) {
        urlKey = pageSizeKey;
      }

      const urlValue = searchParams.get(urlKey);

      if (urlValue !== null) {
        // 根据默认值类型自动转换
        if (typeof defaultValue === "number") {
          const num = Number(urlValue);
          result[typedKey] = (Number.isNaN(num) ? defaultValue : num) as T[keyof T];
        } else if (typeof defaultValue === "boolean") {
          result[typedKey] = (urlValue === "true") as T[keyof T];
        } else {
          result[typedKey] = urlValue as T[keyof T];
        }
      }
    });

    return result;
  }, [searchParams, defaults, pageKey, pageSizeKey, pageFieldName, pageSizeFieldName]);

  /**
   * 更新参数
   */
  const updateParams = useCallback(
    (updates: Partial<T>, options?: UpdateParamsOptions) => {
      const { resetPage = false, replace = true } = options || {};

      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);

          // 判断是否为筛选条件变化
          const isFilterChange = filterKeys.some((key) => key in updates);

          // 筛选条件变化时自动重置页码
          if (resetPage || isFilterChange) {
            next.set(pageKey, "1");
          }

          // 更新参数
          Object.entries(updates).forEach(([key, value]) => {
            const typedKey = key as keyof T;

            // 处理页码字段的特殊映射
            let urlKey = key;
            if (typedKey === pageFieldName) {
              urlKey = pageKey;
            } else if (typedKey === pageSizeFieldName) {
              urlKey = pageSizeKey;
            }

            // 只保留有值的参数
            if (value !== undefined && value !== "" && value !== null) {
              next.set(urlKey, String(value));
            } else {
              next.delete(urlKey);
            }
          });

          return next;
        },
        { replace }
      );
    },
    [setSearchParams, filterKeys, pageKey, pageSizeKey, pageFieldName, pageSizeFieldName]
  );

  return { params, updateParams };
}
