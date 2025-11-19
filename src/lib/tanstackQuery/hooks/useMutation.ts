/**
 * 统一的 Mutation Hooks 模块
 * 提供统一的 useMutation Hook，整合基础功能和乐观更新功能，支持 mutationKey、mutation defaults、乐观更新和自动回滚
 */

import type {
  MutationFunction,
  MutationKey,
  QueryClient,
  QueryKey,
  UseMutationOptions as TanStackUseMutationOptions,
  UseMutationResult
} from "@tanstack/react-query";
import type { MutationContext, MutationOptions } from "../types";
import type { EntityWithId } from "../types/selectors";

import { useQueryClient, useMutation as useTanStackMutation } from "@tanstack/react-query";
import { DEFAULT_MUTATION_CONFIG } from "../core/config";

export type { MutationKey };

/**
 * Mutation 默认配置类型
 * @property {TanStackUseMutationOptions} [key] - mutation 的唯一标识符和配置选项
 */
export interface MutationDefaultsConfig {
  [key: string]: TanStackUseMutationOptions<any, any, any, any>;
}

/**
 * 统一的 useMutation Hook
 * 添加默认配置，支持智能重试、指数退避、mutationKey、乐观更新和自动回滚
 *
 * @template TData - 返回数据类型
 * @template TError - 错误类型
 * @template TVariables - 变量类型
 * @template TContext - 上下文类型
 * @param {MutationOptions<TData, TError, TVariables, TContext>} options - Mutation 选项
 * @returns {UseMutationResult<TData, TError, TVariables, TContext>} Mutation 结果
 */
export function useMutation<TData = unknown, TError = Error, TVariables = void, TContext = unknown>(
  options: MutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const queryClient = useQueryClient();
  const { optimistic, onMutate, onError, onSuccess, onSettled, ...restOptions } = options;

  type MutationCtx = MutationContext<unknown, TContext>;

  const mutationConfig: TanStackUseMutationOptions<TData, TError, TVariables, MutationCtx> = {
    ...restOptions,
    retry: restOptions.retry ?? DEFAULT_MUTATION_CONFIG?.retry,
    retryDelay: restOptions.retryDelay ?? DEFAULT_MUTATION_CONFIG?.retryDelay,
    gcTime: restOptions.gcTime ?? DEFAULT_MUTATION_CONFIG?.gcTime
  } as TanStackUseMutationOptions<TData, TError, TVariables, MutationCtx>;

  // 如果没有配置乐观更新，使用基础实现
  if (!optimistic) {
    if (onMutate) {
      mutationConfig.onMutate = onMutate as TanStackUseMutationOptions<
        TData,
        TError,
        TVariables,
        MutationCtx
      >["onMutate"];
    }
    if (onError) {
      mutationConfig.onError = onError as TanStackUseMutationOptions<TData, TError, TVariables, MutationCtx>["onError"];
    }
    if (onSuccess) {
      mutationConfig.onSuccess = onSuccess as TanStackUseMutationOptions<
        TData,
        TError,
        TVariables,
        MutationCtx
      >["onSuccess"];
    }
    if (onSettled) {
      mutationConfig.onSettled = onSettled as TanStackUseMutationOptions<
        TData,
        TError,
        TVariables,
        MutationCtx
      >["onSettled"];
    }
  } else {
    // 乐观更新的 onMutate
    mutationConfig.onMutate = async (variables: TVariables) => {
      // 如果乐观更新被禁用，只执行用户的 onMutate
      if (optimistic.enabled === false) {
        const mutateCallback = onMutate as (vars: TVariables) => Promise<TContext | undefined>;
        const userContext = onMutate ? await mutateCallback(variables) : undefined;
        return { userContext } as MutationCtx;
      }

      try {
        // 1. 取消正在进行的查询，避免覆盖乐观更新
        await queryClient.cancelQueries({ queryKey: optimistic.queryKey });

        // 2. 获取当前数据快照用于回滚
        const previousData = queryClient.getQueryData(optimistic.queryKey);

        // 3. 应用字段映射（如果配置了）
        // ⚠️ 重要：字段映射只用于乐观更新显示，不影响实际的 API 请求
        // mutationFn 使用的是原始的 variables，确保与后端接口一致
        let mappedVariables: TVariables = variables;
        if (optimistic.fieldMapping && typeof variables === "object" && variables !== null) {
          mappedVariables = { ...variables } as TVariables;
          const sourceObj = variables as Record<string, unknown>;
          const targetObj = mappedVariables as Record<string, unknown>;

          Object.entries(optimistic.fieldMapping).forEach(([sourceField, targetField]) => {
            if (sourceField in sourceObj) {
              targetObj[targetField] = sourceObj[sourceField];
            }
          });
        }

        // 4. 立即更新 UI（乐观更新）
        // 使用 mappedVariables 只是为了在 UI 中正确显示
        queryClient.setQueryData(optimistic.queryKey, (oldData) => optimistic.updater(oldData, mappedVariables));

        // 5. 执行用户自定义的 onMutate（如果有）
        const mutateCallback = onMutate as (vars: TVariables) => Promise<TContext | undefined>;
        const userContext = onMutate ? await mutateCallback(variables) : undefined;

        // 6. 返回 context 用于错误回滚
        return { previousData, userContext } as MutationCtx;
      } catch (error) {
        console.error("[Optimistic Update] Error during optimistic update:", error);
        return { userContext: undefined } as MutationCtx;
      }
    };

    // 乐观更新的 onError - 自动回滚
    mutationConfig.onError = (error, variables, context) => {
      // 回滚数据到之前的状态
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(optimistic.queryKey, context.previousData);
      }

      // 执行自定义回滚逻辑
      if (optimistic.rollback && context?.previousData !== undefined) {
        try {
          optimistic.rollback(context.previousData, error as Error);
        } catch (rollbackError) {
          console.error("[Optimistic Update] Error during rollback:", rollbackError);
        }
      }

      // 调用用户的 onError（传递用户的 context）
      if (onError) {
        const errorCallback = onError as (err: TError, vars: TVariables, ctx: TContext) => void;
        errorCallback(error, variables, context?.userContext as TContext);
      }
    };

    // 乐观更新的 onSuccess
    mutationConfig.onSuccess = (data, variables, context) => {
      // 成功时刷新查询数据，确保与服务器同步
      queryClient.invalidateQueries({ queryKey: optimistic.queryKey });

      // 调用用户的 onSuccess（传递用户的 context）
      if (onSuccess) {
        const successCallback = onSuccess as (d: TData, vars: TVariables, ctx: TContext) => void;
        successCallback(data, variables, context?.userContext as TContext);
      }
    };

    // 乐观更新的 onSettled
    mutationConfig.onSettled = (data, error, variables, context) => {
      // 调用用户的 onSettled（传递用户的 context）
      if (onSettled) {
        const settledCallback = onSettled as (
          d: TData | undefined,
          err: TError | null,
          vars: TVariables,
          ctx: TContext
        ) => void;
        settledCallback(data, error, variables, context?.userContext as TContext);
      }
    };
  }

  return useTanStackMutation(mutationConfig) as UseMutationResult<TData, TError, TVariables, TContext>;
}

/**
 * 设置 mutation 默认配置
 * 在应用初始化时设置 mutation 的默认配置，实现配置复用
 *
 * @param {QueryClient} queryClient - QueryClient 实例
 * @param {MutationDefaultsConfig} config - mutation 默认配置对象
 */
export function setupMutationDefaults(queryClient: QueryClient, config: MutationDefaultsConfig): void {
  Object.entries(config).forEach(([key, options]) => {
    queryClient.setMutationDefaults([key], options);
  });
}

// ==================== 高级 Mutation Hooks ====================

/**
 * 列表变更 Hook - 专门用于列表数据的变更操作,自动刷新列表查询
 * @template T - 实体类型
 * @param mutationFn - Mutation 函数
 * @param queryKey - 查询键
 * @param options - Mutation 选项
 * @returns Mutation 结果
 */
export function useListMutation<T extends EntityWithId>(
  mutationFn: MutationFunction<T, { operation: string; data: Partial<T> }>,
  queryKey: QueryKey,
  options?: TanStackUseMutationOptions<T, Error, { operation: string; data: Partial<T> }> & {
    mutationKey?: readonly unknown[];
  }
) {
  const queryClient = useQueryClient();

  return useTanStackMutation({
    mutationFn,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    ...options,
    mutationKey: options?.mutationKey
  });
}

/**
 * 批量变更 Hook - 用于批量数据更新操作,支持 mutationKey 追踪
 * @template TData - 返回数据类型
 * @template TError - 错误类型
 * @template TVariables - 变量类型
 * @param mutationFn - Mutation 函数
 * @param options - Mutation 选项
 * @returns Mutation 结果
 */
export function useBatchMutation<TData = unknown, TError = Error, TVariables = unknown[]>(
  mutationFn: MutationFunction<TData[], TVariables>,
  options?: TanStackUseMutationOptions<TData[], TError, TVariables> & {
    mutationKey?: readonly unknown[];
  }
) {
  return useTanStackMutation({
    mutationFn,
    ...options,
    mutationKey: options?.mutationKey
  });
}

/**
 * 条件乐观更新 Hook - 根据条件决定是否应用乐观更新
 * @template TData - 返回数据类型
 * @template TError - 错误类型
 * @template TVariables - 变量类型
 * @template TContext - 上下文类型
 * @param mutationFn - Mutation 函数
 * @param condition - 条件函数
 * @param options - Mutation 选项
 * @returns Mutation 结果
 */
export function useConditionalOptimisticMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown
>(
  mutationFn: MutationFunction<TData, TVariables>,
  condition: (variables: TVariables) => boolean,
  options?: Omit<MutationOptions<TData, TError, TVariables, TContext>, "mutationFn"> & {
    mutationKey?: readonly unknown[];
  }
) {
  const queryClient = useQueryClient();
  const { mutationKey, optimistic, onMutate, onError, onSettled, onSuccess } = options || {};

  type MutationCtx = MutationContext<unknown, TContext>;

  const mutationConfig: TanStackUseMutationOptions<TData, TError, TVariables, MutationCtx> = {
    mutationKey,
    mutationFn
  };

  if (optimistic) {
    mutationConfig.onMutate = async (variables: TVariables) => {
      const conditionMet = condition(variables);

      if (!conditionMet || optimistic.enabled === false) {
        const mutateCallback = onMutate as (vars: TVariables) => Promise<TContext | undefined>;
        const userContext = onMutate ? await mutateCallback(variables) : undefined;
        return { userContext, conditionMet: false };
      }

      try {
        await queryClient.cancelQueries({ queryKey: optimistic.queryKey });
        const previousData = queryClient.getQueryData(optimistic.queryKey);

        queryClient.setQueryData(optimistic.queryKey, (oldData) => optimistic.updater(oldData, variables));

        const mutateCallback = onMutate as (vars: TVariables) => Promise<TContext | undefined>;
        const userContext = onMutate ? await mutateCallback(variables) : undefined;

        return { previousData, userContext, conditionMet: true };
      } catch (error) {
        console.error("[Conditional Optimistic Update] Error during optimistic update:", error);
        return { userContext: undefined, conditionMet: false };
      }
    };

    mutationConfig.onError = (error, variables, context) => {
      if (context?.conditionMet && context?.previousData !== undefined) {
        queryClient.setQueryData(optimistic.queryKey, context.previousData);

        if (optimistic.rollback) {
          try {
            optimistic.rollback(context.previousData, error as Error);
          } catch (rollbackError) {
            console.error("[Conditional Optimistic Update] Error during rollback:", rollbackError);
          }
        }
      }

      if (onError) {
        const errorCallback = onError as (err: TError, vars: TVariables, ctx: TContext) => void;
        errorCallback(error, variables, context?.userContext as TContext);
      }
    };

    mutationConfig.onSuccess = (data, variables, context) => {
      if (onSuccess) {
        const successCallback = onSuccess as (d: TData, vars: TVariables, ctx: TContext) => void;
        successCallback(data, variables, context?.userContext as TContext);
      }
    };

    mutationConfig.onSettled = (data, error, variables, context) => {
      if (context?.conditionMet) {
        queryClient.invalidateQueries({ queryKey: optimistic.queryKey });
      }

      if (onSettled) {
        const settledCallback = onSettled as (
          d: TData | undefined,
          err: TError | null,
          vars: TVariables,
          ctx: TContext
        ) => void;
        settledCallback(data, error, variables, context?.userContext as TContext);
      }
    };
  } else {
    if (onMutate) {
      mutationConfig.onMutate = async (variables) => {
        const mutateCallback = onMutate as (vars: TVariables) => Promise<TContext | undefined>;
        const userContext = await mutateCallback(variables);
        return { userContext, conditionMet: false };
      };
    }
    if (onError) {
      mutationConfig.onError = (error, variables, context) => {
        const errorCallback = onError as (err: TError, vars: TVariables, ctx: TContext) => void;
        errorCallback(error, variables, context?.userContext as TContext);
      };
    }
    if (onSuccess) {
      mutationConfig.onSuccess = (data, variables, context) => {
        const successCallback = onSuccess as (d: TData, vars: TVariables, ctx: TContext) => void;
        successCallback(data, variables, context?.userContext as TContext);
      };
    }
    if (onSettled) {
      mutationConfig.onSettled = (data, error, variables, context) => {
        const settledCallback = onSettled as (
          d: TData | undefined,
          err: TError | null,
          vars: TVariables,
          ctx: TContext
        ) => void;
        settledCallback(data, error, variables, context?.userContext as TContext);
      };
    }
  }

  return useTanStackMutation(mutationConfig);
}

// ==================== 工具函数 ====================

/**
 * 批量取消查询 - 取消多个查询
 * @param queryClient - QueryClient 实例
 * @param queryKeys - 查询键数组
 */
export async function cancelQueriesBatch(
  queryClient: QueryClient,
  queryKeys: Array<Parameters<QueryClient["cancelQueries"]>[0]>
): Promise<void> {
  await Promise.all(queryKeys.map((queryKey) => queryClient.cancelQueries(queryKey)));
}

/**
 * 批量设置查询数据 - 批量更新多个查询的数据
 * @param queryClient - QueryClient 实例
 * @param updates - 更新配置数组
 */
export function setQueryDataBatch(
  queryClient: QueryClient,
  updates: Array<{
    queryKey: Parameters<QueryClient["setQueryData"]>[0];
    updater: Parameters<QueryClient["setQueryData"]>[1];
  }>
): void {
  updates.forEach(({ queryKey, updater }) => {
    queryClient.setQueryData(queryKey, updater);
  });
}

/**
 * 批量失效查询 - 使多个查询失效并重新获取
 * @param queryClient - QueryClient 实例
 * @param queryKeys - 查询键数组
 */
export async function invalidateQueriesBatch(
  queryClient: QueryClient,
  queryKeys: Array<Parameters<QueryClient["invalidateQueries"]>[0]>
): Promise<void> {
  await Promise.all(queryKeys.map((queryKey) => queryClient.invalidateQueries(queryKey)));
}
