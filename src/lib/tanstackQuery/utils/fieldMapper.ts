/**
 * 字段映射工具
 *
 * 用于乐观更新时从配置数据中补全名称字段
 */

import type { QueryClient } from "@tanstack/react-query";

/**
 * 字段映射配置
 */
export interface FieldMappingConfig {
  /** 名称字段名 */
  nameField: string;
  /** 配置数据的键名 */
  configKey: string;
}

/**
 * 创建字段补全函数
 *
 * @param queryKey - 配置数据的 Query Key
 * @param mappings - 字段映射配置 { idField: { nameField, configKey } }
 * @returns 字段补全函数
 */
export function createFieldEnricher<T = any>(queryKey: any, mappings: Record<string, FieldMappingConfig>) {
  return (data: T, queryClient: QueryClient): T => {
    const config = queryClient.getQueryData<any>(queryKey);
    if (!config) return data;

    const result: any = { ...data };

    // 遍历映射配置
    Object.entries(mappings).forEach(([idField, { nameField, configKey }]) => {
      const idValue = (data as any)[idField];
      if (idValue == null) return;

      const options = config[configKey];
      if (!options?.length) return;

      // 使用 Map 实现 O(1) 查找
      const optionMap = new Map(options.map((item: any) => [String(item.value), item.label]));
      const label = optionMap.get(String(idValue));

      if (label) {
        result[nameField] = label;
      }
    });

    return result;
  };
}

/**
 * 创建临时 ID（用于乐观更新）
 */
export function createTempId(prefix = "temp"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 创建乐观更新的基础字段
 */
export function createOptimisticBase(customFields?: Record<string, any>): Record<string, any> {
  const now = new Date().toISOString();
  return {
    createTime: now,
    updateTime: now,
    createUser: "",
    updateUser: "",
    deleteStatus: 0,
    ...customFields
  };
}
