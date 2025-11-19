import type { IIndicatorAddParams, IIndicatorEditParams, IIndicatorItem, IndicatorFormValues } from "../types";
import type { SelectOption as TreeSelectOption } from "@/types/project-config";
import type { UISelectOption } from "@/types/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useSmartPrefetch } from "@/lib/tanstackQuery/hooks/usePrefetch";
import { joinIfArray, splitToArray } from "@/lib/utils";
import { useAddMutation, useEditMutation } from "../api";
import { useFormAllConfigOptionsQuery } from "../shared";
import { useParams } from "./useList";

// ==================== 表单验证 Schema ====================

/** 指标表单验证模式 */
const indicatorFormSchema = z
  .object({
    parameterName: z.string().min(1, "指标名称不能为空").max(100, "指标名称不能超过100个字符"),
    designPhaseId: z.string().min(1, "请选择设计阶段"),
    meterialsIds: z.array(z.string()).min(1, "请至少选择一个项目资料来源"),
    parameterClassifyId: z.string().min(1, "请选择指标分类"),
    engineerLevel: z.string().min(1, "请选择业务层级"),
    engineerCategoryId: z.string().optional(),
    engineerCategorySubIds: z.array(z.string()).optional(),
    dataType: z.string().min(1, "请选择数据类型"),
    stageIds: z.array(z.string()).min(1, "请至少选择一个评审环节"),
    majorCategoryId: z.string().min(1, "请选择所属专业"),
    applicableConditionIds: z.array(z.string()).min(1, "请至少选择一个适用条件"),
    intermediateResult: z.number().int().min(0).max(1),
    enableStatus: z.number().int().min(0).max(1)
  })
  .refine(
    (data) => {
      // 业务规则：当业务层级为标包时，必须选择所属工程子类
      if (data.engineerLevel === "1" && !data.engineerCategorySubIds) {
        return false;
      }
      return true;
    },
    {
      message: "当业务层级为标包时，请选择所属工程子类",
      path: ["engineerCategorySubIds"]
    }
  );

// ==================== Hooks ====================

/**
 * 表单视图模型 Hook
 */
export function useFormVM(initialData?: IIndicatorItem | null, onClose?: () => void) {
  const { prefetch, shouldPrefetch } = useSmartPrefetch();
  const { data: formAllConfigData, isLoading: isLoadingConfig } = useFormAllConfigOptionsQuery();

  useEffect(() => {
    if (shouldPrefetch && formAllConfigData) {
      prefetch(
        ["project-config", "project-type,design-phases"],
        async () => {
          const { projectConfigService } = await import("@/service/project-config");
          return projectConfigService.getProjectConfig({ configTypes: "project-type,design-phases" });
        },
        { staleTime: 30 * 60 * 1000 }
      );
    }
  }, [shouldPrefetch, formAllConfigData, prefetch]);

  const { params } = useParams();
  const queryParams = useMemo(
    () => ({ currentPage: params.currentPage, pageSize: params.pageSize }),
    [params.currentPage, params.pageSize]
  );

  const addMutation = useAddMutation(queryParams);
  const editMutation = useEditMutation(queryParams);
  const isSubmitting = addMutation.isPending || editMutation.isPending;

  const form = useForm<IndicatorFormValues>({
    resolver: zodResolver(indicatorFormSchema),
    defaultValues: {
      parameterName: "",
      designPhaseId: "",
      meterialsIds: [],
      parameterClassifyId: "",
      engineerLevel: "",
      engineerCategoryId: "",
      engineerCategorySubIds: [],
      dataType: "",
      stageIds: [],
      majorCategoryId: "",
      applicableConditionIds: [],
      intermediateResult: 0,
      enableStatus: 1
    }
  });

  // 数据回显
  useEffect(() => {
    if (isLoadingConfig || !formAllConfigData) return;

    if (!initialData) {
      form.reset({
        parameterName: "",
        designPhaseId: "",
        meterialsIds: [],
        parameterClassifyId: "",
        engineerLevel: "",
        engineerCategoryId: "",
        engineerCategorySubIds: [],
        dataType: "",
        stageIds: [],
        majorCategoryId: "",
        applicableConditionIds: [],
        intermediateResult: 0,
        enableStatus: 1
      });
      return;
    }

    const formData: IndicatorFormValues = {
      parameterName: initialData.parameterName || "",
      designPhaseId: String(initialData.designPhaseId || ""),
      meterialsIds: splitToArray(initialData.meterialsIds),
      parameterClassifyId: String(initialData.parameterClassifyId || ""),
      engineerLevel: String(initialData.engineerLevel || ""),
      engineerCategoryId: String(initialData.engineerCategoryId || ""),
      engineerCategorySubIds: splitToArray(initialData.engineerCategorySubIds),
      dataType: String(initialData.dataType || ""),
      stageIds: splitToArray(initialData.stageIds),
      majorCategoryId: String(initialData.majorCategoryId || ""),
      applicableConditionIds: splitToArray(initialData.applicableConditionIds),
      intermediateResult: initialData.intermediateResult || 0,
      enableStatus: initialData.enableStatus ?? 1
    };
    form.reset(formData);
  }, [isLoadingConfig, formAllConfigData, initialData, form]);

  const businessLevelValue = form.watch("engineerLevel");
  const isEngineerSubcategoryEnabled = businessLevelValue === "1";

  const skipFirstEngineerLevelChange = useRef(true);
  useEffect(() => {
    if (skipFirstEngineerLevelChange.current) {
      skipFirstEngineerLevelChange.current = false;
      return;
    }
    if (!isEngineerSubcategoryEnabled) {
      const categoryId = form.getValues("engineerCategoryId");
      const subIds = form.getValues("engineerCategorySubIds");
      if (categoryId || (subIds && subIds.length > 0)) {
        form.setValue("engineerCategoryId", "");
        form.setValue("engineerCategorySubIds", []);
      }
    }
  }, [isEngineerSubcategoryEnabled, form]);

  const parameterClassifyTreeData: TreeSelectOption[] = formAllConfigData?.parameterClassify || [];
  const designStageSelectOptions: UISelectOption[] = formAllConfigData?.designStage || [];
  const materialDirectorySelectOptions: UISelectOption[] = formAllConfigData?.materialDirectory || [];
  const businessLevelSelectOptions: UISelectOption[] = formAllConfigData?.engineerLevel || [];
  const dataTypeSelectOptions: UISelectOption[] = formAllConfigData?.dataType || [];
  const reviewStageSelectOptions: UISelectOption[] = formAllConfigData?.reviewStage || [];
  const professionSelectOptions: UISelectOption[] = formAllConfigData?.majorCategories || [];
  const applicableScopeSelectOptions: UISelectOption[] = formAllConfigData?.applicableConditions || [];
  const engineeringCategoryOptions = formAllConfigData?.engineeringCategory || [];

  const onSubmit = async (values: IndicatorFormValues) => {
    const processedValues = {
      ...values,
      stageIds: joinIfArray(values.stageIds),
      applicableConditionIds: joinIfArray(values.applicableConditionIds),
      meterialsIds: joinIfArray(values.meterialsIds),
      engineerCategorySubIds: joinIfArray(values.engineerCategorySubIds)
    };

    try {
      if (initialData?.id) {
        const editParams: IIndicatorEditParams = {
          ...processedValues,
          id: initialData.id,
          engineerCategoryId: processedValues.engineerCategoryId || "",
          engineerCategorySubIds: processedValues.engineerCategorySubIds || ""
        };
        await editMutation.mutateAsync(editParams);
        toast.success("编辑成功");
      } else {
        const addParams: IIndicatorAddParams = {
          ...processedValues,
          engineerCategoryId: processedValues.engineerCategoryId || "",
          engineerCategorySubIds: processedValues.engineerCategorySubIds || ""
        };
        await addMutation.mutateAsync(addParams);
        toast.success("创建成功");
      }
      onClose?.();
    } catch (error: any) {
      toast.error(error?.message || (initialData?.id ? "编辑失败" : "创建失败"));
    }
  };

  return {
    isLoadingConfig,
    form,
    onSubmit,
    isSubmitting,
    isEngineerSubcategoryEnabled,
    parameterClassifyTreeData,
    designStageSelectOptions,
    materialDirectorySelectOptions,
    businessLevelSelectOptions,
    dataTypeSelectOptions,
    reviewStageSelectOptions,
    professionSelectOptions,
    applicableScopeSelectOptions,
    engineeringCategoryOptions
  };
}
