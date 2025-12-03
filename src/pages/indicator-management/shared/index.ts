// decouple types from react-query
import type { FormAllConfigOptionsResponse, IIndicatorQueryParams } from "../types";
import {
  createAppQueryOptions,
  createMutationKeyFactory,
  queryKeys,
  TIME_CONSTANTS
} from "@qiaopeng/tanstack-query-plus/core";
import { useEnhancedQuery } from "@qiaopeng/tanstack-query-plus/hooks";
import { createQueryKeyFactory } from "@qiaopeng/tanstack-query-plus/utils";

// 统一的查询键工厂（使用通用工具）
const baseIndicatorKeys = createQueryKeyFactory<IIndicatorQueryParams>({
  namespace: "indicator",
  normalizeConfig: {
    required: ["currentPage", "pageSize"],
    defaults: { currentPage: 1, pageSize: 10 },
    sortKeys: true,
    removeEmpty: true
  }
});

// 扩展工厂，添加自定义 key
export const indicatorKeys = {
  ...baseIndicatorKeys,
  // 添加表单配置的特殊 key
  formConfig: () => [...queryKeys.all, "indicator", "formConfig"] as const
};

// 统一的 Mutation 键工厂（共享）
const indicatorMutationBase = createMutationKeyFactory("indicator");
export const indicatorMutationKeys = {
  ...indicatorMutationBase,
  add: () => indicatorMutationBase.create(),
  toggleStatus: (id?: string) =>
    id ? (["indicator", "toggleStatus", id] as const) : (["indicator", "toggleStatus"] as const)
};

// 表单配置选项（共享）
export async function getFormAllConfigOptions(): Promise<FormAllConfigOptionsResponse> {
  try {
    const { projectConfigService } = await import("@/service/project-config");
    const response = await projectConfigService.getIndicatorFormAllConfigOptions();

    return {
      parameterClassify: response.parameterClassify || [],
      designStage: response.designStage || [],
      materialDirectory: response.materialDirectory || [],
      engineerLevel: response.engineerLevel || [],
      dataType: response.dataType || [],
      reviewStage: response.reviewStage || [],
      majorCategories: response.majorCategories || [],
      applicableConditions: response.applicableConditions || [],
      engineeringCategory: response.engineeringCategory || []
    };
  } catch (error) {
    console.error("获取表单配置选项失败:", error);
    throw new Error(`获取表单配置选项失败: ${error instanceof Error ? error.message : "未知错误"}`);
  }
}

// 共享的 QueryOptions：表单配置
export function formConfigQueryOptions() {
  return createAppQueryOptions<FormAllConfigOptionsResponse>({
    queryKey: indicatorKeys.formConfig(),
    queryFn: getFormAllConfigOptions,
    staleTime: TIME_CONSTANTS.THIRTY_MINUTES, // 30 分钟
    gcTime: TIME_CONSTANTS.ONE_HOUR // 1 小时
  });
}

// 共享的 Hook：表单配置查询
export function useFormAllConfigOptionsQuery(options?: any) {
  return useEnhancedQuery<FormAllConfigOptionsResponse, Error, FormAllConfigOptionsResponse, any>({
    ...formConfigQueryOptions(),
    ...options
  });
}
