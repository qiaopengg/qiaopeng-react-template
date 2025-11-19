import type { UseQueryOptions } from "@tanstack/react-query";
import type { IIndicatorPageResponse, IIndicatorQueryParams } from "../types";
import { useSuspenseQuery } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { TIME_CONSTANTS } from "@/lib/tanstackQuery/core/config";
import { useMutation } from "@/lib/tanstackQuery/hooks/useMutation";
import { indicatorKeys, indicatorMutationKeys } from "../shared";

// ==================== 列表相关 API ====================

/** 获取指标列表 */
async function getIndicatorList(params: IIndicatorQueryParams): Promise<IIndicatorPageResponse> {
  return http.get<IIndicatorPageResponse>("/indicator-management/page-with-attributes", { params });
}

/** 删除指标 */
async function deleteIndicator(id: string): Promise<void> {
  return http.delete<void>(`/indicator-management/${id}`);
}

/**
 * 切换指标状态
 * @param params - 包含指标 ID 和目标状态
 * @param params.id - 指标 ID
 * @param params.status - 目标状态（0: 禁用, 1: 启用）
 * @returns 操作是否成功
 */
async function toggleIndicatorStatus(params: { id: string; status: number }): Promise<boolean> {
  return http.put<boolean>(`/indicator-management/status/${params.id}`, null, {
    params: { status: params.status }
  });
}

// ==================== React Query Hooks（列表） ====================

/** 列表 Suspense 查询 Hook */
export function useListSuspenseQuery(
  params?: IIndicatorQueryParams,
  options?: Partial<Omit<UseQueryOptions<IIndicatorPageResponse, Error>, "queryKey" | "queryFn">>
) {
  return useSuspenseQuery({
    queryKey: indicatorKeys.list(params),
    queryFn: () => getIndicatorList(params || {}),
    staleTime: TIME_CONSTANTS.FIVE_MINUTES, // 5分钟内从缓存读取
    gcTime: TIME_CONSTANTS.TEN_MINUTES, // 10分钟后清理缓存
    ...options
  });
}

/** 删除 Mutation Hook */
export function useDeleteMutation(params?: IIndicatorQueryParams) {
  const queryParams = params || {};

  return useMutation<void, Error, string>({
    mutationKey: indicatorMutationKeys.delete(),
    mutationFn: deleteIndicator,
    optimistic: {
      queryKey: indicatorKeys.list(queryParams),
      updater: <TQueryData = IIndicatorPageResponse>(oldData: TQueryData | undefined, itemId: string) => {
        const typedOldData = oldData as IIndicatorPageResponse | undefined;
        if (!typedOldData) return oldData;
        return {
          ...typedOldData,
          Rows: typedOldData.Rows.filter((item) => item.id !== itemId),
          Total: typedOldData.Total - 1
        } as TQueryData;
      },
      enabled: true,
      rollback: (_previousData, error) => {
        console.error("[Indicator] 删除失败，已回滚:", error);
      }
    }
  });
}

/** 切换状态 Mutation Hook */
export function useToggleStatusMutation(params?: IIndicatorQueryParams) {
  const queryParams = params || {};

  return useMutation<boolean, Error, { id: string; status: number }>({
    mutationKey: indicatorMutationKeys.toggleStatus(),
    mutationFn: toggleIndicatorStatus,
    optimistic: {
      queryKey: indicatorKeys.list(queryParams),
      updater: <TQueryData = IIndicatorPageResponse>(
        oldData: TQueryData | undefined,
        variables: { id: string; status: number }
      ) => {
        const typedOldData = oldData as IIndicatorPageResponse | undefined;
        if (!typedOldData) return oldData;
        return {
          ...typedOldData,
          Rows: typedOldData.Rows.map((item) =>
            item.id === variables.id ? { ...item, enableStatus: variables.status } : item
          )
        } as TQueryData;
      },
      enabled: true,
      rollback: (_previousData, error) => {
        console.error("[Indicator] 状态切换失败，已回滚:", error);
      }
    }
  });
}
