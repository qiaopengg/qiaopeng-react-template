/**
 * Query Key 工具函数
 *
 * 提供统一的 Query Key 规范化和工厂方法
 * 保证相同查询条件产生相同的缓存 key，提升缓存命中率
 */

/**
 * 规范化配置
 */
export interface NormalizeConfig<T = any> {
  /**
   * 必需字段列表
   * 这些字段会使用默认值（如果未提供）
   */
  required?: (keyof T)[];

  /**
   * 默认值对象
   */
  defaults?: Partial<T>;

  /**
   * 是否按字母顺序排序可选字段
   * @default true
   */
  sortKeys?: boolean;

  /**
   * 是否移除空值（undefined、null、空字符串）
   * @default true
   */
  removeEmpty?: boolean;
}

/**
 * 规范化查询参数
 *
 * 功能：
 * 1. 固定字段顺序（必需字段在前，可选字段按字母排序）
 * 2. 统一类型转换（数字、字符串 trim）
 * 3. 移除空值（undefined、null、空字符串）
 * 4. 使用默认值填充必需字段
 *
 * @param params - 原始参数
 * @param config - 规范化配置
 * @returns 规范化后的参数对象

 */
export function normalizeQueryParams<T extends Record<string, any>>(
  params: T | undefined,
  config: NormalizeConfig<T> = {}
): Record<string, any> {
  const { required = [], defaults = {}, sortKeys = true, removeEmpty = true } = config;

  // 如果没有参数，返回默认值
  if (!params) {
    return { ...defaults };
  }

  const normalized: Record<string, any> = {};

  // 1. 添加必需字段（固定顺序）
  required.forEach((key) => {
    const value = params[key] ?? (defaults as any)[key];
    if (value !== undefined) {
      // 类型转换
      if (typeof value === "number" || (typeof value === "string" && !Number.isNaN(Number(value)))) {
        normalized[String(key)] = Number(value);
      } else {
        normalized[String(key)] = value;
      }
    }
  });

  // 2. 添加可选字段
  const optionalKeys = Object.keys(params).filter((key) => !required.includes(key as keyof T));

  // 按字母顺序排序（可选）
  if (sortKeys) {
    optionalKeys.sort();
  }

  optionalKeys.forEach((key) => {
    const value = params[key];

    // 移除空值（可选）
    if (removeEmpty && (value === undefined || value === null || value === "")) {
      return;
    }

    // 字符串 trim
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed || !removeEmpty) {
        normalized[key] = trimmed;
      }
    } else if (value !== undefined && value !== null) {
      normalized[key] = value;
    }
  });

  return normalized;
}

/**
 * Query Key 工厂配置
 */
export interface QueryKeyFactoryConfig<TParams = any> {
  /**
   * 命名空间（模块名）
   */
  namespace: string;

  /**
   * 规范化配置
   */
  normalizeConfig?: NormalizeConfig<TParams>;
}

/**
 * Query Key 工厂返回类型
 */
export interface QueryKeyFactory<TParams = any> {
  /**
   * 所有查询的根 key
   */
  all: () => readonly [string];

  /**
   * 列表查询的根 key
   */
  lists: () => readonly [string, string];

  /**
   * 特定参数的列表查询 key
   */
  list: (params?: TParams) => readonly [string, string, Record<string, any>];

  /**
   * 详情查询的根 key
   */
  details: () => readonly [string, string];

  /**
   * 特定 ID 的详情查询 key
   */
  detail: (id: string) => readonly [string, string, string];

  /**
   * 自定义查询 key
   */
  custom: (queryName: string, params?: any) => readonly [string, string, string, any?];
}

/**
 * 创建标准的 Query Key 工厂
 *
 * 提供统一的 Query Key 生成方法，保证缓存稳定性
 *
 * @param config - 工厂配置
 * @returns Query Key 工厂对象
 */
export function createQueryKeyFactory<TParams = any>(config: QueryKeyFactoryConfig<TParams>): QueryKeyFactory<TParams> {
  const { namespace, normalizeConfig } = config;

  return {
    all: () => [namespace] as const,

    lists: () => [namespace, "list"] as const,

    list: (params?: TParams) => {
      const normalized = normalizeQueryParams(params as any, normalizeConfig);
      return [namespace, "list", normalized] as const;
    },

    details: () => [namespace, "detail"] as const,

    detail: (id: string) => [namespace, "detail", id] as const,

    custom: (queryName: string, params?: any) => {
      if (params !== undefined) {
        return [namespace, "custom", queryName, params] as const;
      }
      return [namespace, "custom", queryName] as const;
    }
  };
}

/**
 * 创建简单的 Query Key 工厂（不带参数规范化）
 *
 * 适用于不需要复杂参数处理的场景
 *
 * @param namespace - 命名空间
 * @returns Query Key 工厂对象
 */
export function createSimpleQueryKeyFactory(namespace: string): QueryKeyFactory {
  return createQueryKeyFactory({ namespace });
}

/**
 * 比较两个 Query Key 是否相等
 *
 * @param key1 - Query Key 1
 * @param key2 - Query Key 2
 * @returns 是否相等
 */
export function isQueryKeyEqual(key1: readonly any[], key2: readonly any[]): boolean {
  if (key1.length !== key2.length) return false;

  return key1.every((value, index) => {
    const other = key2[index];

    // 基本类型比较
    if (typeof value !== "object" || value === null) {
      return value === other;
    }

    // 对象比较（深度比较）
    if (typeof other !== "object" || other === null) {
      return false;
    }

    const keys1 = Object.keys(value);
    const keys2 = Object.keys(other);

    if (keys1.length !== keys2.length) return false;

    return keys1.every((key) => value[key] === other[key]);
  });
}

/**
 * 从 Query Key 中提取参数
 *
 * @param queryKey - Query Key
 * @returns 参数对象（如果存在）
 *
 */
export function extractParamsFromKey(queryKey: readonly any[]): Record<string, any> | undefined {
  // 通常参数在最后一个位置
  const lastItem = queryKey[queryKey.length - 1];

  if (typeof lastItem === "object" && lastItem !== null && !Array.isArray(lastItem)) {
    return lastItem;
  }

  return undefined;
}
