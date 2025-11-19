// 表单相关类型定义
import type { SelectOption as ProjectSelectOption } from "@/types/project-config";

/** 指标编辑请求参数 */
export interface IIndicatorEditParams {
  id: string;
  parameterName: string;
  designPhaseId: string;
  meterialsIds: string;
  parameterClassifyId: string;
  engineerLevel: string;
  engineerCategoryId?: string;
  engineerCategorySubIds?: string;
  dataType: string;
  stageIds: string;
  majorCategoryId: string;
  applicableConditionIds: string;
  intermediateResult: number;
  enableStatus: number;
}

/** 指标新增请求参数 */
export interface IIndicatorAddParams {
  parameterName: string;
  designPhaseId: string;
  meterialsIds: string;
  parameterClassifyId: string;
  engineerLevel: string;
  engineerCategoryId?: string;
  engineerCategorySubIds?: string;
  dataType: string;
  stageIds: string;
  majorCategoryId: string;
  applicableConditionIds: string;
  intermediateResult: number;
  enableStatus: number;
}

/** 表单配置选项响应类型 */
export interface FormAllConfigOptionsResponse {
  parameterClassify: ProjectSelectOption[];
  designStage: ProjectSelectOption[];
  materialDirectory: ProjectSelectOption[];
  engineerLevel: ProjectSelectOption[];
  dataType: ProjectSelectOption[];
  reviewStage: ProjectSelectOption[];
  majorCategories: ProjectSelectOption[];
  applicableConditions: ProjectSelectOption[];
  engineeringCategory: ProjectSelectOption[];
}

/** 指标表单值类型 */
export interface IndicatorFormValues {
  parameterName: string;
  designPhaseId: string;
  meterialsIds: string[];
  parameterClassifyId: string;
  engineerLevel: string;
  engineerCategoryId?: string;
  engineerCategorySubIds?: string[];
  dataType: string;
  stageIds: string[];
  majorCategoryId: string;
  applicableConditionIds: string[];
  intermediateResult: number;
  enableStatus: number;
}
