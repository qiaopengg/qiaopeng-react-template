// 列表相关类型定义
import type { PageResult } from "@/types/api";

/** 参数分类数据结构 */
export interface IParameterClassify {
  id: number;
  classifyName: string;
  level: number;
  parentId: number;
  deleteStatus: number;
  createTime: string;
  updateTime: string;
  createUser: string;
  updateUser: string;
}

/** 工程类别数据结构 */
export interface IEngineerCategory {
  id: number;
  engineeringCategory: string;
  projectTypeId: number;
  deleteStatus: number;
  createTime: string;
  updateTime: string;
  createUser: string;
  updateUser: string;
}

/** 指标项数据结构 */
export interface IIndicatorItem {
  id: string;
  parameterId: string;
  parameterName: string;
  parameterClassifyName?: string;
  enableStatus: number;
  parameterClassify?: IParameterClassify;
  engineerCategory?: IEngineerCategory;
  engineerLevel: string;
  engineerLevelName?: string;
  intermediateResult: number;
  deleteStatus: number;
  createTime: string;
  updateTime: string;
  createUser: string;
  updateUser: string;
  designPhaseId?: string;
  meterialsIds?: string;
  parameterClassifyId?: string;
  dataType?: string;
  dataTypeName?: string;
  stageIds?: string;
  majorCategoryId?: string;
  applicableConditionIds?: string;
  engineerCategoryId?: string;
  engineerCategorySubIds?: string;
}

/** 分页响应数据结构 */
export type IIndicatorPageResponse = PageResult<IIndicatorItem>;

/** 查询参数接口 */
export interface IIndicatorQueryParams extends Record<string, unknown> {
  currentPage?: number;
  pageSize?: number;
  projectTypeId?: string;
  designPhaseId?: string;
}
