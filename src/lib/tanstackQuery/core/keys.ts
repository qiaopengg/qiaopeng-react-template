/**
 * 查询键管理
 * 提供分层的、类型安全的查询键工厂
 * 分层模式: root -> entity -> detail -> sub-resource
 */

import type { QueryKey } from "@tanstack/react-query";

/** 基础查询键工厂 - 提供常用实体的查询键生成方法 */
export const queryKeys = {
  all: ["tanstack-query"] as const,
  users: () => [...queryKeys.all, "users"] as const,
  user: (id: string) => [...queryKeys.users(), id] as const,
  userProfile: (id: string) => [...queryKeys.user(id), "profile"] as const,
  userSettings: (id: string) => [...queryKeys.user(id), "settings"] as const,
  usersByRole: (role: string) => [...queryKeys.users(), "by-role", role] as const,
  posts: () => [...queryKeys.all, "posts"] as const,
  post: (id: string) => [...queryKeys.posts(), id] as const,
  postsByUser: (userId: string) => [...queryKeys.posts(), "by-user", userId] as const,
  postsByTag: (tag: string) => [...queryKeys.posts(), "by-tag", tag] as const,
  postComments: (postId: string) => [...queryKeys.post(postId), "comments"] as const,
  search: (query: string, type?: string) => [...queryKeys.all, "search", { query, type }] as const,
  notifications: () => [...queryKeys.all, "notifications"] as const,
  notification: (id: string) => [...queryKeys.notifications(), id] as const,
  unreadNotifications: () => [...queryKeys.notifications(), "unread"] as const,
  settings: () => [...queryKeys.all, "settings"] as const,
  appSettings: () => [...queryKeys.settings(), "app"] as const,
  userPreferences: (userId: string) => [...queryKeys.settings(), "preferences", userId] as const
};

/**
 * 创建带过滤器的查询键
 *
 * @param {QueryKey} baseKey - 基础查询键
 * @param {Record<string, unknown>} filters - 过滤条件对象
 * @returns {QueryKey} 包含过滤条件的查询键
 */
export function createFilteredKey(baseKey: QueryKey, filters: Record<string, unknown>): QueryKey {
  return [...baseKey, "filtered", filters];
}

/**
 * 创建带分页的查询键
 *
 * @param {QueryKey} baseKey - 基础查询键
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {QueryKey} 包含分页信息的查询键
 */
export function createPaginatedKey(baseKey: QueryKey, page: number, pageSize: number): QueryKey {
  return [...baseKey, "paginated", { page, pageSize }];
}

/**
 * 创建带排序的查询键
 *
 * @param {QueryKey} baseKey - 基础查询键
 * @param {string} sortBy - 排序字段
 * @param {"asc" | "desc"} [sortOrder] - 排序方向
 * @returns {QueryKey} 包含排序信息的查询键
 */
export function createSortedKey(baseKey: QueryKey, sortBy: string, sortOrder: "asc" | "desc" = "asc"): QueryKey {
  return [...baseKey, "sorted", { sortBy, sortOrder }];
}

/**
 * 创建带搜索的查询键
 *
 * @param {QueryKey} baseKey - 基础查询键
 * @param {string} searchTerm - 搜索词
 * @param {string[]} [searchFields] - 搜索字段
 * @returns {QueryKey} 包含搜索信息的查询键
 */
export function createSearchKey(baseKey: QueryKey, searchTerm: string, searchFields?: string[]): QueryKey {
  return [...baseKey, "search", { term: searchTerm, fields: searchFields }];
}

/**
 * 创建复合查询键（分页 + 过滤 + 排序）
 *
 * @param {QueryKey} baseKey - 基础查询键
 * @param {object} options - 查询选项
 * @param {number} [options.page] - 页码
 * @param {number} [options.pageSize] - 每页数量
 * @param {Record<string, unknown>} [options.filters] - 过滤条件
 * @param {string} [options.sortBy] - 排序字段
 * @param {"asc" | "desc"} [options.sortOrder] - 排序方向
 * @param {string} [options.search] - 搜索词
 * @returns {QueryKey} 包含所有查询参数的查询键
 */
export function createComplexKey(
  baseKey: QueryKey,
  options: {
    page?: number;
    pageSize?: number;
    filters?: Record<string, unknown>;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    search?: string;
  }
): QueryKey {
  const params: Record<string, unknown> = {};

  if (options.page !== undefined && options.pageSize !== undefined) {
    params.page = options.page;
    params.pageSize = options.pageSize;
  }

  if (options.filters && Object.keys(options.filters).length > 0) {
    params.filters = options.filters;
  }

  if (options.sortBy) {
    params.sortBy = options.sortBy;
    params.sortOrder = options.sortOrder || "asc";
  }

  if (options.search) {
    params.search = options.search;
  }

  return [...baseKey, "complex", params];
}

/**
 * 检查查询键是否匹配模式
 * 支持部分匹配和对象深度比较
 *
 * @param {QueryKey} queryKey - 要检查的查询键
 * @param {QueryKey} pattern - 匹配模式
 * @returns {boolean} 是否匹配
 */
export function matchesKeyPattern(queryKey: QueryKey, pattern: QueryKey): boolean {
  if (pattern.length > queryKey.length) {
    return false;
  }

  return pattern.every((patternPart, index) => {
    const keyPart = queryKey[index];

    // 如果模式部分是对象，进行深度比较
    if (typeof patternPart === "object" && typeof keyPart === "object") {
      return JSON.stringify(patternPart) === JSON.stringify(keyPart);
    }

    return patternPart === keyPart;
  });
}

/**
 * 验证查询键格式
 * 检查是否为非空数组且不包含 null/undefined
 *
 * @param {QueryKey} queryKey - 要验证的查询键
 * @returns {boolean} 是否有效
 */
export function validateQueryKey(queryKey: QueryKey): boolean {
  if (!Array.isArray(queryKey) || queryKey.length === 0) {
    return false;
  }

  return queryKey.every(
    (part) =>
      part !== null &&
      part !== undefined &&
      (typeof part === "string" ||
        typeof part === "number" ||
        typeof part === "boolean" ||
        (typeof part === "object" && part !== null))
  );
}

/**
 * 检查查询键是否包含特定实体
 *
 * @param {QueryKey} queryKey - 查询键
 * @param {string} entity - 实体名称
 * @returns {boolean} 是否包含该实体
 */
export function containsEntity(queryKey: QueryKey, entity: string): boolean {
  return queryKey.includes(entity);
}

/**
 * 提取查询键中的实体 ID
 *
 * @param {QueryKey} queryKey - 查询键
 * @param {number} entityIndex - 实体在键中的索引位置
 * @returns {string | undefined} 实体 ID 或 undefined
 */
export function extractEntityId(queryKey: QueryKey, entityIndex: number): string | undefined {
  const value = queryKey[entityIndex];
  return typeof value === "string" ? value : undefined;
}

/**
 * 规范化查询键
 * 移除 undefined 和 null 值
 *
 * @param {QueryKey} queryKey - 查询键
 * @returns {QueryKey} 规范化后的查询键
 */
export function normalizeQueryKey(queryKey: QueryKey): QueryKey {
  return queryKey.filter((part) => part !== null && part !== undefined);
}

/**
 * 比较两个查询键是否相等
 * 支持对象深度比较
 *
 * @param {QueryKey} key1 - 第一个查询键
 * @param {QueryKey} key2 - 第二个查询键
 * @returns {boolean} 是否相等
 */
export function areKeysEqual(key1: QueryKey, key2: QueryKey): boolean {
  if (key1.length !== key2.length) {
    return false;
  }

  return key1.every((part, index) => {
    const otherPart = key2[index];

    if (typeof part === "object" && typeof otherPart === "object") {
      return JSON.stringify(part) === JSON.stringify(otherPart);
    }

    return part === otherPart;
  });
}

/**
 * 创建领域特定的查询键工厂
 * 为特定领域生成标准化的查询键
 *
 * @param {string} domain - 领域名称
 * @returns {object} 领域特定的键工厂对象
 */
export function createDomainKeyFactory(domain: string) {
  return {
    /** 所有该领域的查询 */
    all: () => [...queryKeys.all, domain] as const,

    /** 列表查询 */
    lists: () => [...queryKeys.all, domain, "list"] as const,

    /** 带参数的列表查询 */
    list: (params?: Record<string, unknown>) =>
      params ? ([...queryKeys.all, domain, "list", params] as const) : ([...queryKeys.all, domain, "list"] as const),

    /** 详情查询 */
    details: () => [...queryKeys.all, domain, "detail"] as const,

    /** 特定实体的详情 */
    detail: (id: string | number) => [...queryKeys.all, domain, "detail", id] as const,

    /** 实体的子资源 */
    subResource: (id: string | number, resource: string) => [...queryKeys.all, domain, "detail", id, resource] as const,

    /** 关系查询 */
    byRelation: (relation: string, relationId: string | number) =>
      [...queryKeys.all, domain, `by-${relation}`, relationId] as const
  };
}

/**
 * 创建 Mutation 键工厂
 * 为特定领域生成标准化的 mutation 键
 *
 * @param {string} domain - 领域名称
 * @returns {object} Mutation 键工厂对象
 */
export function createMutationKeyFactory(domain: string) {
  return {
    /** 创建操作 */
    create: () => [domain, "create"] as const,

    /** 更新操作 */
    update: (id?: string | number) => (id ? ([domain, "update", id] as const) : ([domain, "update"] as const)),

    /** 删除操作 */
    delete: (id?: string | number) => (id ? ([domain, "delete", id] as const) : ([domain, "delete"] as const)),

    /** 批量操作 */
    batch: (operation: string) => [domain, "batch", operation] as const,

    /** 自定义操作 */
    custom: (operation: string, id?: string | number) =>
      id ? ([domain, operation, id] as const) : ([domain, operation] as const)
  };
}
