/**
 * 批量查询 Hooks
 * 提供批量查询、统计、操作等功能
 */

import type {
  QueryClient,
  UseQueryOptions,
  UseQueryResult,
  UseSuspenseQueryOptions,
  UseSuspenseQueryResult
} from "@tanstack/react-query";
import type {
  BatchErrorAggregate,
  BatchOperationReport,
  BatchQueryConfig,
  BatchQueryOperations,
  BatchQueryStats,
  BatchRetryConfig
} from "../types/optimistic";
import { useQueries, useQuery, useQueryClient, useSuspenseQueries } from "@tanstack/react-query";

import { useEffect, useMemo, useRef } from "react";

interface InternalBatchQueryOperations extends BatchQueryOperations {
  _queryClient: QueryClient;
  _queries: UseQueryOptions[];
  _results: UseQueryResult[] | UseSuspenseQueryResult[];
}

function createErrorAggregate<TError = Error>(
  results: UseQueryResult[] | UseSuspenseQueryResult[],
  queries: UseQueryOptions[]
): BatchErrorAggregate<TError> {
  const errors: Array<{ index: number; error: TError; queryKey?: unknown[] }> = [];
  const errorsByType = new Map<string, TError[]>();

  results.forEach((result, index) => {
    if (result.isError && result.error) {
      const error = result.error as TError;
      const queryKey = queries[index]?.queryKey as unknown[];

      errors.push({ index, error, queryKey });

      // 按错误类型分组
      const errorType = error instanceof Error ? error.constructor.name : "Unknown";
      if (!errorsByType.has(errorType)) {
        errorsByType.set(errorType, []);
      }
      errorsByType.get(errorType)!.push(error);
    }
  });

  const firstError = errors.length > 0 ? errors[0].error : null;
  const lastError = errors.length > 0 ? errors[errors.length - 1].error : null;

  // 生成错误摘要
  const errorSummary =
    errors.length === 0
      ? "No errors"
      : errors.length === 1
        ? `1 error: ${firstError instanceof Error ? firstError.message : String(firstError)}`
        : `${errors.length} errors: ${Array.from(errorsByType.entries())
            .map(([type, errs]) => `${type}(${errs.length})`)
            .join(", ")}`;

  return {
    totalErrors: errors.length,
    errors,
    errorsByType,
    firstError,
    lastError,
    errorSummary
  };
}

function createOperationReport<TData = unknown, TError = Error>(
  results: UseQueryResult[] | UseSuspenseQueryResult[],
  queries: UseQueryOptions[],
  startTime: number,
  retryCount = 0
): BatchOperationReport<TData, TError> {
  const total = results.length;
  const successResults: Array<{ index: number; data: TData }> = [];
  const failureErrors: Array<{ index: number; error: TError; queryKey?: unknown[] }> = [];

  results.forEach((result, index) => {
    if (result.isSuccess && result.data !== undefined) {
      successResults.push({ index, data: result.data as TData });
    } else if (result.isError && result.error) {
      failureErrors.push({
        index,
        error: result.error as TError,
        queryKey: queries[index]?.queryKey as unknown[]
      });
    }
  });

  const successful = successResults.length;
  const failed = failureErrors.length;
  const isFullSuccess = successful === total && failed === 0;
  const isFullFailure = failed === total && successful === 0;
  const isPartialSuccess = successful > 0 && failed > 0;

  return {
    total,
    successful,
    failed,
    successResults,
    failureErrors,
    isPartialSuccess,
    isFullSuccess,
    isFullFailure,
    duration: Date.now() - startTime,
    retryCount
  };
}

async function executeBatchOperationWithRetry<T = unknown>(
  operation: () => Promise<PromiseSettledResult<T>[]>,
  retryConfig?: BatchRetryConfig
): Promise<{ results: PromiseSettledResult<T>[]; retryCount: number }> {
  const maxRetries = retryConfig?.maxRetries ?? 0;
  const retryDelay = retryConfig?.retryDelay ?? 1000;
  const shouldRetry = retryConfig?.shouldRetry;

  let retryCount = 0;
  let results = await operation();

  // 如果没有配置重试或没有失败，直接返回
  if (maxRetries === 0) {
    return { results, retryCount };
  }

  // 重试逻辑
  while (retryCount < maxRetries) {
    const hasFailures = results.some((r) => r.status === "rejected");
    if (!hasFailures) break;

    // 检查是否应该重试
    if (shouldRetry) {
      const firstError = results.find((r) => r.status === "rejected");
      if (firstError && firstError.status === "rejected") {
        const error = firstError.reason instanceof Error ? firstError.reason : new Error(String(firstError.reason));
        if (!shouldRetry(error, retryCount + 1)) {
          break;
        }
      }
    }

    // 计算延迟
    const delay = typeof retryDelay === "function" ? retryDelay(retryCount) : retryDelay;

    // 等待后重试
    await new Promise((resolve) => setTimeout(resolve, delay));
    retryCount++;
    results = await operation();
  }

  return { results, retryCount };
}

/**
 * 批量查询统计信息计算
 * 计算批量查询的统计信息
 *
 * @param {UseQueryResult[] | UseSuspenseQueryResult[]} results - 查询结果数组
 * @returns {BatchQueryStats} 批量查询统计信息
 */
export function calculateBatchStats(results: UseQueryResult[] | UseSuspenseQueryResult[]): BatchQueryStats {
  const total = results.length;
  const loading = results.filter((result) => result.isLoading).length;
  const success = results.filter((result) => result.isSuccess).length;
  const error = results.filter((result) => result.isError).length;
  const stale = results.filter((result) => result.isStale).length;

  return {
    total,
    loading,
    success,
    error,
    stale,
    successRate: total > 0 ? (success / total) * 100 : 0,
    errorRate: total > 0 ? (error / total) * 100 : 0
  };
}

/**
 * 增强版 useQueries Hook
 * 提供批量查询、统计和操作功能
 *
 * @param {UseQueryOptions[]} queries - 查询选项数组
 * @param {BatchQueryConfig} [config] - 批量查询配置
 * @returns {{ data: UseQueryResult[], stats: BatchQueryStats, operations: BatchQueryOperations }} 查询结果、统计信息和操作方法
 */
export function useEnhancedQueries(queries: UseQueryOptions[], config: BatchQueryConfig = {}) {
  const queryClient = useQueryClient();

  const { results, stats } = useQueries({
    queries,
    combine: (results) => ({
      results,
      stats: calculateBatchStats(results)
    })
  });

  const retryCountRef = useRef<number>(0);

  const operations: InternalBatchQueryOperations = {
    _queryClient: queryClient,
    _queries: queries,
    _results: results,

    refetchAll: async () => {
      const operation = () => {
        const promises = queries.map((query) =>
          queryClient.refetchQueries({
            queryKey: query.queryKey,
            exact: true
          })
        );
        return Promise.allSettled(promises);
      };

      const { results: settledResults, retryCount } = await executeBatchOperationWithRetry(
        operation,
        config.retryConfig
      );
      retryCountRef.current = retryCount;

      if (config.enablePartialSuccess) {
        const report = operations.getOperationReport();
        if (report.isPartialSuccess && config.onPartialSuccess) {
          config.onPartialSuccess(report);
        }
      }

      return settledResults;
    },

    invalidateAll: async () => {
      const operation = () => {
        const promises = queries.map((query) =>
          queryClient.invalidateQueries({
            queryKey: query.queryKey,
            exact: true
          })
        );
        return Promise.allSettled(promises);
      };

      const { results: settledResults, retryCount } = await executeBatchOperationWithRetry(
        operation,
        config.retryConfig
      );
      retryCountRef.current = retryCount;

      return settledResults;
    },

    cancelAll: async () => {
      const promises = queries.map((query) =>
        queryClient.cancelQueries({
          queryKey: query.queryKey,
          exact: true
        })
      );
      return Promise.allSettled(promises);
    },

    resetAll: async () => {
      const operation = () => {
        const promises = queries.map((query) =>
          queryClient.resetQueries({
            queryKey: query.queryKey,
            exact: true
          })
        );
        return Promise.allSettled(promises);
      };

      const { results: settledResults, retryCount } = await executeBatchOperationWithRetry(
        operation,
        config.retryConfig
      );
      retryCountRef.current = retryCount;

      return settledResults;
    },

    removeAll: () => {
      queries.forEach((query) => {
        queryClient.removeQueries({
          queryKey: query.queryKey,
          exact: true
        });
      });
    },

    retryFailed: async () => {
      const failedIndices = results
        .map((result, index) => (result.isError ? index : -1))
        .filter((index) => index !== -1);

      if (failedIndices.length === 0) {
        return createOperationReport(results, queries, 0, 0);
      }

      const retryPromises = failedIndices.map((index) => {
        const query = queries[index];
        return queryClient.refetchQueries({
          queryKey: query.queryKey,
          exact: true
        });
      });

      await Promise.allSettled(retryPromises);
      retryCountRef.current++;

      return operations.getOperationReport();
    },

    getErrorAggregate: () => {
      return createErrorAggregate(results, queries);
    },

    getOperationReport: () => {
      return createOperationReport(results, queries, 0, retryCountRef.current);
    }
  };

  return {
    data: results,
    stats,
    operations,
    config
  };
}

/**
 * 增强版 useSuspenseQueries Hook
 * Suspense 模式的批量查询
 *
 * @param {UseSuspenseQueryOptions[]} queries - Suspense 查询选项数组
 * @param {BatchQueryConfig} [config] - 批量查询配置
 * @returns {{ data: UseSuspenseQueryResult[], stats: BatchQueryStats, operations: BatchQueryOperations }} 查询结果、统计信息和操作方法
 */
export function useEnhancedSuspenseQueries(queries: UseSuspenseQueryOptions[], config: BatchQueryConfig = {}) {
  const queryClient = useQueryClient();

  const { results, stats } = useSuspenseQueries({
    queries,
    combine: (results) => ({
      results,
      stats: calculateBatchStats(results)
    })
  });

  const retryCountRef = useRef<number>(0);

  const operations: InternalBatchQueryOperations = {
    _queryClient: queryClient,
    _queries: queries,
    _results: results,

    refetchAll: async () => {
      const operation = () => {
        const promises = queries.map((query) =>
          queryClient.refetchQueries({
            queryKey: query.queryKey,
            exact: true
          })
        );
        return Promise.allSettled(promises);
      };

      const { results: settledResults, retryCount } = await executeBatchOperationWithRetry(
        operation,
        config.retryConfig
      );
      retryCountRef.current = retryCount;

      if (config.enablePartialSuccess) {
        const report = operations.getOperationReport();
        if (report.isPartialSuccess && config.onPartialSuccess) {
          config.onPartialSuccess(report);
        }
      }

      return settledResults;
    },

    invalidateAll: async () => {
      const operation = () => {
        const promises = queries.map((query) =>
          queryClient.invalidateQueries({
            queryKey: query.queryKey,
            exact: true
          })
        );
        return Promise.allSettled(promises);
      };

      const { results: settledResults, retryCount } = await executeBatchOperationWithRetry(
        operation,
        config.retryConfig
      );
      retryCountRef.current = retryCount;

      return settledResults;
    },

    cancelAll: async () => {
      const promises = queries.map((query) =>
        queryClient.cancelQueries({
          queryKey: query.queryKey,
          exact: true
        })
      );
      return Promise.allSettled(promises);
    },

    resetAll: async () => {
      const operation = () => {
        const promises = queries.map((query) =>
          queryClient.resetQueries({
            queryKey: query.queryKey,
            exact: true
          })
        );
        return Promise.allSettled(promises);
      };

      const { results: settledResults, retryCount } = await executeBatchOperationWithRetry(
        operation,
        config.retryConfig
      );
      retryCountRef.current = retryCount;

      return settledResults;
    },

    removeAll: () => {
      queries.forEach((query) => {
        queryClient.removeQueries({
          queryKey: query.queryKey,
          exact: true
        });
      });
    },

    retryFailed: async () => {
      const failedIndices = results
        .map((result, index) => (result.isError ? index : -1))
        .filter((index) => index !== -1);

      if (failedIndices.length === 0) {
        return createOperationReport(results, queries, 0, 0);
      }

      const retryPromises = failedIndices.map((index) => {
        const query = queries[index];
        return queryClient.refetchQueries({
          queryKey: query.queryKey,
          exact: true
        });
      });

      await Promise.allSettled(retryPromises);
      retryCountRef.current++;

      return operations.getOperationReport();
    },

    getErrorAggregate: () => {
      return createErrorAggregate(results, queries);
    },

    getOperationReport: () => {
      return createOperationReport(results, queries, 0, retryCountRef.current);
    }
  };

  return {
    data: results,
    stats,
    operations,
    config
  };
}

/**
 * 创建批量查询配置
 * 创建批量查询的配置对象
 *
 * @param {Partial<BatchQueryConfig>} [config] - 配置选项
 * @returns {BatchQueryConfig} 批量查询配置
 */
export function createBatchQueryConfig(config: Partial<BatchQueryConfig> = {}): BatchQueryConfig {
  return {
    enableStats: true,
    enableBatchOperations: true,
    autoRefreshInterval: undefined,
    onBatchSuccess: undefined,
    onBatchError: undefined,
    onBatchSettled: undefined,
    enablePartialSuccess: false,
    onPartialSuccess: undefined,
    retryConfig: undefined,
    ...config
  };
}

/**
 * 批量查询工具函数
 * 提供批量查询的辅助工具函数
 */
export const batchQueryUtils = {
  isAllLoading: (results: UseQueryResult[] | UseSuspenseQueryResult[]): boolean => {
    return results.every((result) => result.isLoading);
  },

  isAllSuccess: (results: UseQueryResult[] | UseSuspenseQueryResult[]): boolean => {
    return results.every((result) => result.isSuccess);
  },

  hasError: (results: UseQueryResult[] | UseSuspenseQueryResult[]): boolean => {
    return results.some((result) => result.isError);
  },

  hasStale: (results: UseQueryResult[] | UseSuspenseQueryResult[]): boolean => {
    return results.some((result) => result.isStale);
  },

  getAllErrors: (results: UseQueryResult[] | UseSuspenseQueryResult[]): Error[] => {
    return results
      .filter((result) => result.isError)
      .map((result) => result.error)
      .filter((error): error is Error => error instanceof Error);
  },

  getAllData: (results: UseQueryResult[] | UseSuspenseQueryResult[]): unknown[] => {
    return results.filter((result) => result.isSuccess).map((result) => result.data);
  },

  /** 检查是否所有查询都处于 pending 状态 */
  isAllPending: (results: UseQueryResult[] | UseSuspenseQueryResult[]): boolean => {
    return results.every((result) => result.isPending);
  },

  /** 检查是否有任何查询正在获取数据 */
  isAnyFetching: (results: UseQueryResult[] | UseSuspenseQueryResult[]): boolean => {
    return results.some((result) => result.isFetching);
  },

  /** 获取所有成功的查询数据（带类型） */
  getSuccessData: <T>(results: UseQueryResult<T>[]): T[] => {
    return results.filter((result) => result.isSuccess && result.data !== undefined).map((result) => result.data as T);
  },

  /** 获取第一个错误 */
  getFirstError: (results: UseQueryResult[] | UseSuspenseQueryResult[]): Error | null => {
    const errorResult = results.find((result) => result.isError);
    return errorResult?.error instanceof Error ? errorResult.error : null;
  },

  /** 创建错误聚合报告 */
  createErrorAggregate: <TError = Error>(
    results: UseQueryResult[] | UseSuspenseQueryResult[],
    queries: UseQueryOptions[]
  ): BatchErrorAggregate<TError> => {
    return createErrorAggregate<TError>(results, queries);
  },

  /** 创建操作报告 */
  createOperationReport: <TData = unknown, TError = Error>(
    results: UseQueryResult[] | UseSuspenseQueryResult[],
    queries: UseQueryOptions[],
    startTime: number,
    retryCount = 0
  ): BatchOperationReport<TData, TError> => {
    return createOperationReport<TData, TError>(results, queries, startTime, retryCount);
  }
};

/**
 * 使用 combine 选项的批量查询
 * 自定义合并查询结果
 *
 * @template TCombinedResult - 合并结果类型
 * @param {object} options - 查询选项
 * @param {UseQueryOptions[]} options.queries - 查询选项数组
 * @param {(results: UseQueryResult[]) => TCombinedResult} [options.combine] - 合并函数
 * @returns {TCombinedResult} 合并后的查询结果
 */
export function useCombinedQueries<TCombinedResult = UseQueryResult[]>(options: {
  queries: UseQueryOptions[];
  combine?: (results: UseQueryResult[]) => TCombinedResult;
}): TCombinedResult {
  return useQueries(options) as TCombinedResult;
}

/**
 * 动态批量查询 Hook
 * 根据动态数据生成批量查询
 *
 * @template TItem - 数据项类型
 * @template TData - 查询数据类型
 * @param {object} options - 查询选项
 * @param {TItem[]} options.items - 数据项数组
 * @param {unknown[]} options.queryKeyPrefix - 查询键前缀
 * @param {(item: TItem) => Promise<TData>} options.queryFn - 查询函数
 * @param {boolean} [options.enabled] - 是否启用
 * @param {number} [options.staleTime] - 数据过期时间
 * @param {number} [options.gcTime] - 垃圾回收时间
 * @param {BatchQueryConfig} [options.config] - 批量查询配置
 * @returns {{ data: UseQueryResult[], stats: BatchQueryStats }} 查询结果和统计信息
 */
export function useDynamicBatchQueries<TItem, TData = unknown>(options: {
  items: TItem[];
  queryKeyPrefix: unknown[];
  queryFn: (item: TItem) => Promise<TData>;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  config?: BatchQueryConfig;
}) {
  const { items, queryKeyPrefix, queryFn, enabled = true, staleTime, gcTime, config = {} } = options;

  const queries = useMemo(() => {
    if (!enabled || items.length === 0) return [];

    return items.map((item) => ({
      queryKey: [...queryKeyPrefix, item],
      queryFn: () => queryFn(item),
      staleTime,
      gcTime,
      enabled
    }));
  }, [items, queryKeyPrefix, queryFn, enabled, staleTime, gcTime]);

  return useEnhancedQueries(queries, config);
}

/**
 * 依赖批量查询 Hook
 * 创建依赖于主查询的批量查询
 *
 * @template TPrimaryData - 主查询数据类型
 * @param {object} options - 查询选项
 * @param {UseQueryOptions<TPrimaryData>} options.primaryQuery - 主查询选项
 * @param {(data: TPrimaryData) => UseQueryOptions[]} options.dependentQueries - 依赖查询生成函数
 * @param {BatchQueryConfig} [options.config] - 批量查询配置
 * @returns {{ primaryResult: UseQueryResult<TPrimaryData>, results: UseQueryResult[], stats: BatchQueryStats }} 主查询结果、依赖查询结果和统计信息
 */
export function useDependentBatchQueries<TPrimaryData>(options: {
  primaryQuery: UseQueryOptions<TPrimaryData>;
  dependentQueries: (data: TPrimaryData) => UseQueryOptions[];
  config?: BatchQueryConfig;
}) {
  const { primaryQuery, dependentQueries, config = {} } = options;

  const primaryResult = useQuery(primaryQuery);

  const queries = useMemo(() => {
    try {
      if (!primaryResult.data) {
        return [];
      }
      return dependentQueries(primaryResult.data);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("[useDependentBatchQueries] Error generating dependent queries:", error);
      }
      return [];
    }
  }, [primaryResult.data, dependentQueries]);

  const enhancedQueriesResult = useEnhancedQueries(queries, config);

  return {
    primaryResult,
    results: enhancedQueriesResult.data,
    stats: enhancedQueriesResult.stats,
    operations: enhancedQueriesResult.operations
  };
}

/**
 * 带自动刷新的批量查询 Hook
 * 定时自动刷新批量查询
 *
 * @param {object} options - 查询选项
 * @param {UseQueryOptions[]} options.queries - 查询选项数组
 * @param {number} [options.refreshInterval] - 刷新间隔（毫秒）
 * @param {boolean} [options.enabled] - 是否启用自动刷新
 * @param {BatchQueryConfig} [options.config] - 批量查询配置
 * @returns {{ data: UseQueryResult[], stats: BatchQueryStats }} 查询结果和统计信息
 */
export function useAutoRefreshBatchQueries(options: {
  queries: UseQueryOptions[];
  refreshInterval?: number;
  enabled?: boolean;
  config?: BatchQueryConfig;
}) {
  const { queries, refreshInterval = 30000, enabled = true, config = {} } = options;

  const result = useEnhancedQueries(queries, config);

  useEffect(() => {
    if (!enabled || !refreshInterval || !result.operations) return;

    const intervalId = setInterval(() => {
      result.operations?.refetchAll();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [enabled, refreshInterval, result.operations]);

  return result;
}

/**
 * 仪表板批量查询 Hook
 * 类型安全的仪表板查询
 *
 * @template T - 查询映射类型
 * @param {T} queriesMap - 查询映射对象
 * @returns {{ data: object, results: UseQueryResult[], stats: BatchQueryStats, isLoading: boolean, isError: boolean, isSuccess: boolean }} 查询数据、统计信息和加载状态
 */
export function useDashboardQueries<T extends Record<string, UseQueryOptions>>(queriesMap: T) {
  const queries = useMemo(() => {
    return Object.values(queriesMap);
  }, [queriesMap]);

  type CombinedDataType = {
    [K in keyof T]: T[K] extends UseQueryOptions<infer TData> ? TData : unknown;
  };

  const { results, combinedData, stats } = useQueries({
    queries,
    combine: (results) => {
      const keys = Object.keys(queriesMap) as Array<keyof T>;
      const data = {} as Record<keyof T, unknown>;

      keys.forEach((key, index) => {
        data[key] = results[index].data;
      });

      return {
        results,
        combinedData: data as CombinedDataType,
        stats: calculateBatchStats(results)
      };
    }
  });

  const isLoading = results.some((r) => r.isLoading);
  const isError = results.some((r) => r.isError);
  const isSuccess = results.every((r) => r.isSuccess);

  return {
    data: combinedData,
    results,
    stats,
    isLoading,
    isError,
    isSuccess
  };
}

/**
 * 分页批量查询 Hook
 * 批量查询多个页面
 *
 * @template TData - 数据类型
 * @param {object} options - 查询选项
 * @param {number[]} options.pageNumbers - 页码数组
 * @param {unknown[]} options.queryKeyPrefix - 查询键前缀
 * @param {(page: number) => Promise<TData>} options.queryFn - 查询函数
 * @param {number} [options.staleTime] - 数据过期时间
 * @param {BatchQueryConfig} [options.config] - 批量查询配置
 * @returns {{ data: UseQueryResult[], stats: BatchQueryStats }} 查询结果和统计信息
 */
export function usePaginatedBatchQueries<TData = unknown>(options: {
  pageNumbers: number[];
  queryKeyPrefix: unknown[];
  queryFn: (page: number) => Promise<TData>;
  staleTime?: number;
  config?: BatchQueryConfig;
}) {
  const { pageNumbers, queryKeyPrefix, queryFn, staleTime, config } = options;

  return useDynamicBatchQueries({
    items: pageNumbers,
    queryKeyPrefix,
    queryFn,
    staleTime,
    config
  });
}

/**
 * 条件批量查询 Hook
 * 根据条件启用/禁用查询
 *
 * @param {(UseQueryOptions & { enabled?: boolean })[]} queries - 查询选项数组（包含 enabled 字段）
 * @returns {{ data: UseQueryResult[], stats: BatchQueryStats }} 查询结果和统计信息
 */
export function useConditionalBatchQueries(queries: (UseQueryOptions & { enabled?: boolean })[]) {
  const enabledQueries = useMemo(() => {
    return queries.filter((q) => q.enabled !== false);
  }, [queries]);

  return useEnhancedQueries(enabledQueries);
}

/**
 * 带重试策略的批量查询 Hook
 * 自定义重试策略的批量查询
 *
 * @param {object} options - 查询选项
 * @param {UseQueryOptions[]} options.queries - 查询选项数组
 * @param {number | ((failureCount: number, error: Error) => boolean)} [options.retry] - 重试次数或重试函数
 * @param {number | ((attemptIndex: number) => number)} [options.retryDelay] - 重试延迟
 * @param {BatchQueryConfig} [options.config] - 批量查询配置
 * @returns {{ data: UseQueryResult[], stats: BatchQueryStats }} 查询结果和统计信息
 */
export function useRetryBatchQueries(options: {
  queries: UseQueryOptions[];
  retry?: number | ((failureCount: number, error: Error) => boolean);
  retryDelay?: number | ((attemptIndex: number) => number);
  config?: BatchQueryConfig;
}) {
  const { queries, retry, retryDelay, config } = options;

  const queriesWithRetry = useMemo(() => {
    return queries.map((query) => ({
      ...query,
      retry: query.retry ?? retry,
      retryDelay: query.retryDelay ?? retryDelay
    }));
  }, [queries, retry, retryDelay]);

  return useEnhancedQueries(queriesWithRetry, config);
}

/**
 * 批量查询性能监控 Hook
 * 监控批量查询的性能指标
 *
 * @param {UseQueryResult[] | UseSuspenseQueryResult[]} results - 查询结果数组
 * @returns {object} 性能指标对象
 */
export function useBatchQueryPerformance(results: UseQueryResult[] | UseSuspenseQueryResult[]) {
  return useMemo(() => {
    const stats = calculateBatchStats(results);

    const fetchTimes = results.filter((r) => r.dataUpdatedAt > 0).map((r) => r.dataUpdatedAt);

    const avgFetchTime = fetchTimes.length > 0 ? fetchTimes.reduce((a, b) => a + b, 0) / fetchTimes.length : 0;

    return {
      ...stats,
      avgFetchTime,
      totalQueries: results.length,
      activeQueries: results.filter((r) => r.isFetching).length,
      cachedQueries: results.filter((r) => !r.isStale).length
    };
  }, [results]);
}
