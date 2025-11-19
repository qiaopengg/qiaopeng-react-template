import type { IIndicatorAddParams, IIndicatorEditParams, IIndicatorItem, IIndicatorQueryParams } from "../types";
import { useQueryClient } from "@qiaopeng/tanstack-query-plus";
import { useMutation } from "@qiaopeng/tanstack-query-plus/hooks";
import { createOptimisticBase, createTempId } from "@qiaopeng/tanstack-query-plus/utils";
import { http } from "@/lib/http";
import { enrichNameFields } from "../hooks";
import { indicatorKeys, indicatorMutationKeys } from "../shared";

// ==================== 表单相关 API ====================

/** 创建指标 */
async function createIndicator(data: IIndicatorAddParams): Promise<IIndicatorItem> {
  return http.post<IIndicatorItem>("/indicator-management/addParameter", data);
}

/** 更新指标 */
async function updateIndicator(data: IIndicatorEditParams): Promise<IIndicatorItem> {
  return http.put<IIndicatorItem>("/indicator-management/update-with-attributes", data);
}

// ==================== React Query Hooks（表单/详情） ====================

/** 创建 Mutation Hook */
export function useAddMutation(params?: IIndicatorQueryParams) {
  const queryClient = useQueryClient();
  const queryParams = params || {};

  return useMutation<IIndicatorItem, Error, IIndicatorAddParams>({
    mutationKey: indicatorMutationKeys.add(),
    mutationFn: createIndicator,
    optimistic: {
      queryKey: indicatorKeys.list(queryParams),
      updater: <TQueryData = any>(oldData: TQueryData | undefined, newItem: IIndicatorAddParams) => {
        const typedOldData = oldData as { Rows: IIndicatorItem[]; Total: number } | undefined;
        if (!typedOldData) return oldData;

        // 乐观更新：创建临时项
        const optimisticItem: IIndicatorItem = {
          ...enrichNameFields(newItem, queryClient),
          ...createOptimisticBase({ id: createTempId(), parameterId: "" })
        } as IIndicatorItem;

        return {
          ...typedOldData,
          Rows: [optimisticItem, ...(typedOldData.Rows || [])],
          Total: (typedOldData.Total || 0) + 1
        } as TQueryData;
      },
      enabled: true,
      rollback: (_previousData, error) => {
        console.error("[Indicator] 创建失败，已回滚:", error);
      }
    }
  });
}

/** 更新 Mutation Hook */
export function useUpdateMutation(params?: IIndicatorQueryParams) {
  const queryClient = useQueryClient();
  const queryParams = params || {};

  return useMutation<IIndicatorItem, Error, IIndicatorEditParams>({
    mutationKey: indicatorMutationKeys.update(),
    mutationFn: updateIndicator,
    optimistic: {
      queryKey: indicatorKeys.list(queryParams),
      updater: <TQueryData = any>(oldData: TQueryData | undefined, updatedItem: IIndicatorEditParams) => {
        const typedOldData = oldData as { Rows: IIndicatorItem[]; Total: number } | undefined;
        if (!typedOldData) return oldData;
        return {
          ...typedOldData,
          Rows: (typedOldData.Rows || []).map((item) =>
            item.id === updatedItem.id
              ? {
                  ...item,
                  ...enrichNameFields(updatedItem, queryClient),
                  updateTime: new Date().toISOString()
                }
              : item
          )
        } as TQueryData;
      },
      enabled: true,
      rollback: (_previousData, error) => {
        console.error("[Indicator] 更新失败，已回滚:", error);
      }
    }
  });
}

/** 编辑 Mutation Hook（别名） */
export function useEditMutation(params?: IIndicatorQueryParams) {
  return useUpdateMutation(params);
}
