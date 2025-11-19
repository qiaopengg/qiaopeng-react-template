/**
 * 统一的选项数据结构
 * 用于所有下拉选择框和树形选择器的数据展示
 */
import type { BaseSelectOption } from "@/types/select";

/**
 * 使用公共基础类型统一 SelectOption 定义
 * 保持业务层字符串值的兼容性
 */
export type SelectOption = BaseSelectOption<string>;

/**
 * 项目配置统一接口返回数据结构
 * 根据请求的configTypes参数返回对应的配置数据
 */
export interface IProjectConfigResponse {
  /** 规则分类配置数据 */
  "rule-classify"?: SelectOption[];
  /** 项目类型配置数据 */
  "project-type"?: SelectOption[];
  /** 设计阶段配置数据 */
  "design-phases"?: SelectOption[];
  /** 参数分类配置数据 */
  "parameter-classify"?: SelectOption[];
  /** 评审阶段配置数据 */
  "review-stage"?: SelectOption[];
  /** 材料目录配置数据 */
  "material-directory"?: SelectOption[];
  /** 工程师级别配置数据 */
  "engineer-level"?: SelectOption[];
  /** 工程类别配置数据 */
  "engineering-category"?: SelectOption[];
  /** 数据类型选项 */
  "data-type"?: SelectOption[];
  /** 专业类别选项 */
  "major-categories"?: SelectOption[];
  /** 适用条件选项 */
  "applicable-conditions"?: SelectOption[];
  /** 知识分类配置数据 */
  "knowledge-classify"?: SelectOption[];
}

/**
 * 项目配置请求参数
 * 用于指定需要获取的配置类型
 */
export interface IProjectConfigParams {
  /**
   * 配置类型，多个类型用逗号分隔
   * 可选值: "project-type", "design-phases"
   * 示例: "project-type,design-phases"
   */
  configTypes: string;
}

/**
 * 项目配置服务接口定义
 * 定义了项目配置相关的所有服务方法
 */
export interface IProjectConfigService {
  /**
   * 获取项目配置数据的通用方法
   * @param params 配置参数，包含configTypes等
   * @returns Promise<IProjectConfigResponse> 配置数据
   */
  getProjectConfig: (params: IProjectConfigParams) => Promise<IProjectConfigResponse>;

  /**
   * 获取项目类型选项数据
   * @returns Promise<SelectOption[]> 项目类型选项列表
   */
  getProjectTypeOptions: () => Promise<SelectOption[]>;

  /**
   * 获取设计阶段选项数据
   * @returns Promise<SelectOption[]> 设计阶段选项列表
   */
  getDesignStageOptions: () => Promise<SelectOption[]>;

  /**
   * 获取参数分类选项数据
   * @returns Promise<SelectOption[]> 参数分类选项列表
   */
  getParameterClassifyOptions: () => Promise<SelectOption[]>;

  /**
   * 获取评审环节选项数据
   * @returns Promise<SelectOption[]> 评审环节选项列表
   */
  getReviewStageOptions: () => Promise<SelectOption[]>;

  /**
   * 获取材料目录选项数据
   * @returns Promise<SelectOption[]> 材料目录选项列表
   */
  getMaterialDirectoryOptions: () => Promise<SelectOption[]>;

  /**
   * 获取工程层级选项数据
   * @returns Promise<SelectOption[]> 工程层级选项列表
   */
  getEngineerLevelOptions: () => Promise<SelectOption[]>;

  /**
   * 获取工程类别选项数据
   * @returns Promise<SelectOption[]> 返回工程类别选项数组
   */
  getEngineeringCategoryOptions: () => Promise<SelectOption[]>;

  /**
   * 获取数据类型选项数据
   * @returns Promise<SelectOption[]> 数据类型选项列表
   */
  getDataTypeOptions: () => Promise<SelectOption[]>;

  /**
   * 获取表单配置选项数据（批量获取参数分类和评审环节）
   * @returns Promise<{parameterClassify: SelectOption[], reviewStage: SelectOption[]}> 表单配置数据
   */
  getFormConfigOptions: () => Promise<{
    parameterClassify: SelectOption[];
    reviewStage: SelectOption[];
  }>;
}

/**
 * 项目配置查询钩子选项
 * 用于配置TanStack Query的缓存策略
 */
export interface IProjectConfigQueryOptions {
  /** 数据新鲜时间（毫秒） */
  staleTime?: number;
  /** 垃圾回收时间（毫秒） - v5 中 cacheTime 已重命名为 gcTime */
  gcTime?: number;
  /** 是否启用重试 */
  retry?: boolean | number;
  /** 重试延迟 */
  retryDelay?: number;
}
