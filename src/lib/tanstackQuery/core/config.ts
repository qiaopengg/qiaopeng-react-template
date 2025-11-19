/**
 * TanStack Query 核心配置
 * 提供遵循 v5 最佳实践的默认配置
 */

import type { DefaultOptions } from "@tanstack/react-query";

/** 时间配置常量 - 遵循 v5 最佳实践 */
export const TIME_CONSTANTS = {
  THIRTY_SECONDS: 30 * 1000, // 推荐的默认 staleTime
  ONE_MINUTE: 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  TEN_MINUTES: 10 * 60 * 1000, // 推荐的默认 gcTime
  FIFTEEN_MINUTES: 15 * 60 * 1000,
  THIRTY_MINUTES: 30 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000
} as const;

/**
 * 统一的时间常量
 * 本库默认值: staleTime 30秒, gcTime 10分钟 (与官方默认值不同)
 * 官方默认值: staleTime 0, gcTime 5分钟
 * 官方要求: gcTime 必须大于 staleTime
 */
export const DEFAULT_STALE_TIME = TIME_CONSTANTS.THIRTY_SECONDS; // 30秒（官方默认：0）
export const DEFAULT_GC_TIME = TIME_CONSTANTS.TEN_MINUTES; // 10分钟（官方默认：5分钟）

/** HTTP 错误接口 */
interface HttpError {
  status?: number;
  message?: string;
}

/**
 * 智能重试策略 - 用于查询
 * 4xx 不重试，5xx 和网络错误最多重试 3 次
 *
 * @param {number} failureCount - 失败次数
 * @param {unknown} error - 错误对象
 * @returns {boolean} 是否应该重试
 */
export function defaultQueryRetryStrategy(failureCount: number, error: unknown): boolean {
  const httpError = error as HttpError;

  // 客户端错误（4xx）不重试
  if (httpError?.status && httpError.status >= 400 && httpError.status < 500) {
    return false;
  }
  // 服务器错误（5xx）最多重试3次
  if (httpError?.status && httpError.status >= 500) {
    return failureCount < 3;
  }
  // 网络错误最多重试3次
  return failureCount < 3;
}

/**
 * 智能重试策略 - 用于变更
 * 4xx 不重试，5xx 和网络错误最多重试 2 次
 *
 * @param {number} failureCount - 失败次数
 * @param {unknown} error - 错误对象
 * @returns {boolean} 是否应该重试
 */
export function defaultMutationRetryStrategy(failureCount: number, error: unknown): boolean {
  const httpError = error as HttpError;

  // 客户端错误（4xx）不重试
  if (httpError?.status && httpError.status >= 400 && httpError.status < 500) {
    return false;
  }
  // 服务器错误（5xx）最多重试2次
  if (httpError?.status && httpError.status >= 500) {
    return failureCount < 2;
  }
  // 网络错误最多重试2次
  return failureCount < 2;
}

/**
 * 指数退避重试延迟函数
 * 延迟时间：1s, 2s, 4s, 8s, 16s，最多 30s
 *
 * @param {number} attemptIndex - 重试次数索引（从 0 开始）
 * @returns {number} 延迟时间（毫秒），最大 30 秒
 */
export function exponentialBackoff(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 30000);
}

/**
 * 默认查询配置
 * staleTime 30秒，gcTime 10分钟，智能重试，指数退避延迟
 */
export const DEFAULT_QUERY_CONFIG: DefaultOptions["queries"] = {
  staleTime: DEFAULT_STALE_TIME,
  gcTime: DEFAULT_GC_TIME,
  retry: defaultQueryRetryStrategy,
  retryDelay: exponentialBackoff,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  refetchOnMount: true
};

/**
 * 默认变更配置
 * retry 0（不重试，避免重复操作），指数退避延迟，gcTime 10分钟
 */
export const DEFAULT_MUTATION_CONFIG: DefaultOptions["mutations"] = {
  retry: 0, // 与官方默认一致
  retryDelay: exponentialBackoff,
  gcTime: DEFAULT_GC_TIME
};

/** 全局默认配置 */
export const GLOBAL_QUERY_CONFIG: DefaultOptions = {
  queries: DEFAULT_QUERY_CONFIG,
  mutations: DEFAULT_MUTATION_CONFIG
};

/**
 * 智能重试变更配置（可选）
 * mutations 自动重试，仅适用于幂等操作，请谨慎使用
 */
export const SMART_RETRY_MUTATION_CONFIG: DefaultOptions["mutations"] = {
  retry: defaultMutationRetryStrategy,
  retryDelay: exponentialBackoff,
  gcTime: DEFAULT_GC_TIME
};

/**
 * 开发环境配置
 * 更短的缓存时间，便于调试
 */
export const DEVELOPMENT_CONFIG: DefaultOptions = {
  queries: {
    ...DEFAULT_QUERY_CONFIG,
    staleTime: 0,
    gcTime: TIME_CONSTANTS.TEN_MINUTES,
    retry: 1,
    refetchOnWindowFocus: true
  },
  mutations: {
    ...DEFAULT_MUTATION_CONFIG,
    retry: 0
  }
};

/**
 * 生产环境配置
 * 更长的缓存时间，优化性能
 */
export const PRODUCTION_CONFIG: DefaultOptions = {
  queries: {
    ...DEFAULT_QUERY_CONFIG,
    staleTime: TIME_CONSTANTS.TEN_MINUTES,
    gcTime: TIME_CONSTANTS.THIRTY_MINUTES,
    retry: 3,
    refetchOnWindowFocus: true
  },
  mutations: {
    ...DEFAULT_MUTATION_CONFIG,
    retry: 0 // 与默认值一致，避免重复操作
  }
};

/**
 * 长缓存配置
 * 适用于静态数据
 */
export const LONG_CACHE_CONFIG: DefaultOptions = {
  queries: {
    ...DEFAULT_QUERY_CONFIG,
    staleTime: TIME_CONSTANTS.FIFTEEN_MINUTES,
    gcTime: TIME_CONSTANTS.ONE_HOUR,
    retry: 2,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  },
  mutations: {
    ...DEFAULT_MUTATION_CONFIG,
    retry: 0 // 与默认值一致，避免重复操作
  }
};

/**
 * 实时配置
 * 适用于实时数据场景
 */
export const REALTIME_CONFIG: DefaultOptions = {
  queries: {
    ...DEFAULT_QUERY_CONFIG,
    staleTime: 0,
    gcTime: TIME_CONSTANTS.ONE_MINUTE * 2, // 2分钟（实时数据不需要长时间缓存）
    retry: 5,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: TIME_CONSTANTS.THIRTY_SECONDS
  },
  mutations: DEFAULT_MUTATION_CONFIG
};

/**
 * 根据环境获取配置
 *
 * @param {"development" | "production" | "test"} env - 环境类型
 * @returns {DefaultOptions} 对应环境的配置
 */
export function getConfigByEnvironment(env: "development" | "production" | "test"): DefaultOptions {
  switch (env) {
    case "development":
      return DEVELOPMENT_CONFIG;
    case "production":
      return PRODUCTION_CONFIG;
    case "test":
      return {
        queries: {
          ...DEFAULT_QUERY_CONFIG,
          retry: 0,
          staleTime: 0,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
          refetchOnMount: true
        },
        mutations: {
          ...DEFAULT_MUTATION_CONFIG,
          retry: 0
        }
      };
    default:
      return GLOBAL_QUERY_CONFIG;
  }
}

/**
 * 创建自定义配置
 * 合并默认配置和自定义覆盖项
 *
 * @param {Partial<DefaultOptions>} overrides - 配置覆盖项
 * @returns {DefaultOptions} 合并后的配置
 */
export function createCustomConfig(overrides: Partial<DefaultOptions>): DefaultOptions {
  return {
    queries: {
      ...DEFAULT_QUERY_CONFIG,
      ...overrides.queries
    },
    mutations: {
      ...DEFAULT_MUTATION_CONFIG,
      ...overrides.mutations
    }
  };
}

/**
 * 验证 gcTime 和 staleTime 的关系
 * gcTime 必须大于 staleTime（官方要求）
 *
 * @param {number} staleTime - 数据过期时间（毫秒）
 * @param {number} gcTime - 垃圾回收时间（毫秒）
 * @returns {{ isValid: boolean, warning?: string }} 验证结果和警告信息
 */
export function validateGcTime(
  staleTime: number,
  gcTime: number
): {
  isValid: boolean;
  warning?: string;
} {
  // 官方要求：gcTime 必须大于 staleTime
  if (gcTime <= staleTime) {
    return {
      isValid: false,
      warning:
        `gcTime (${gcTime}ms) 必须大于 staleTime (${staleTime}ms)。` + `当前 gcTime 过小，可能导致缓存数据过早被清理。`
    };
  }

  return { isValid: true };
}

/**
 * 验证配置是否遵循 v5 最佳实践
 * 检查 gcTime > staleTime、使用 gcTime 而非 cacheTime、指数退避重试
 *
 * @param {DefaultOptions} config - 要验证的配置
 * @returns {{ isValid: boolean, warnings: string[] }} 验证结果和警告信息
 */
export function validateConfig(config: DefaultOptions): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let isValid = true;

  // 检查查询配置
  if (config.queries) {
    const staleTime = typeof config.queries.staleTime === "number" ? config.queries.staleTime : DEFAULT_STALE_TIME;
    const gcTime = typeof config.queries.gcTime === "number" ? config.queries.gcTime : DEFAULT_GC_TIME;

    // 1. 验证 gcTime 和 staleTime 的关系
    const gcTimeValidation = validateGcTime(staleTime, gcTime);
    if (!gcTimeValidation.isValid && gcTimeValidation.warning) {
      warnings.push(gcTimeValidation.warning);
      isValid = false;
    } else if (gcTimeValidation.warning) {
      // 只是建议，不影响 isValid
      warnings.push(gcTimeValidation.warning);
    }

    // 2. 检查是否使用了已废弃的 cacheTime
    if ("cacheTime" in config.queries) {
      warnings.push("检测到已废弃的 'cacheTime' 属性。在 React Query v5 中，请使用 'gcTime' 代替。");
      isValid = false;
    }

    // 3. 建议启用 refetchOnWindowFocus
    if (config.queries.refetchOnWindowFocus === false) {
      warnings.push("建议启用 'refetchOnWindowFocus' 以提供更好的用户体验。" + "当用户切换回应用时，数据会自动刷新。");
    }

    // 4. 检查重试延迟是否使用指数退避
    if (typeof config.queries.retryDelay === "number") {
      warnings.push(
        "建议使用指数退避策略作为重试延迟，而不是固定延迟。" +
          "例如：(attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)"
      );
    }
  }

  return { isValid, warnings };
}

/**
 * 确保配置符合 v5 最佳实践
 * 自动调整不符合最佳实践的配置
 *
 * @param {DefaultOptions} config - 原始配置
 * @returns {DefaultOptions} 修正后的配置
 */
export function ensureBestPractices(config: DefaultOptions): DefaultOptions {
  const result: DefaultOptions = { ...config };

  if (result.queries) {
    const queries = { ...result.queries };

    // 先处理已废弃的 cacheTime：如果存在则迁移至 gcTime，并移除该属性
    if ("cacheTime" in queries) {
      const q = queries as Record<string, unknown> & { cacheTime?: number; gcTime?: number };
      const cacheTime = q.cacheTime;

      // 如果 gcTime 未设置而 cacheTime 存在，则使用 cacheTime 的值作为 gcTime
      if (typeof cacheTime === "number" && typeof q.gcTime !== "number") {
        q.gcTime = cacheTime;
      }

      // 移除废弃属性
      delete (q as Record<string, unknown>).cacheTime;

      if (import.meta.env.MODE !== "production") {
        console.warn("[TanStack Query Config] 已移除废弃的 'cacheTime' 属性，改用 'gcTime'。");
      }
    }

    // 确保 gcTime 大于 staleTime（在迁移 cacheTime 之后进行校验）
    const staleTime = typeof queries.staleTime === "number" ? queries.staleTime : DEFAULT_STALE_TIME;
    const gcTime = typeof queries.gcTime === "number" ? queries.gcTime : DEFAULT_GC_TIME;

    const validation = validateGcTime(staleTime, gcTime);
    if (!validation.isValid) {
      // 如果 gcTime <= staleTime，自动调整为 staleTime + 1分钟
      queries.gcTime = staleTime + TIME_CONSTANTS.ONE_MINUTE;

      if (import.meta.env.MODE !== "production") {
        console.warn(
          `[TanStack Query Config] 自动调整 gcTime 从 ${gcTime}ms 到 ${queries.gcTime}ms，` +
            `以确保大于 staleTime (${staleTime}ms)。`
        );
      }
    }

    // 确保使用指数退避重试延迟
    if (typeof queries.retryDelay === "number" || !queries.retryDelay) {
      queries.retryDelay = exponentialBackoff;
    }

    // 默认启用 refetchOnWindowFocus（如果未设置）
    if (queries.refetchOnWindowFocus === undefined) {
      queries.refetchOnWindowFocus = true;
    }

    // 将所有修正后的设置写回
    result.queries = queries;
  }

  return result;
}
