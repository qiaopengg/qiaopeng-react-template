import type { FormAllConfigOptionsResponse } from "@/pages/indicator-management/types";
import type {
  IProjectConfigParams,
  IProjectConfigResponse,
  IProjectConfigService,
  SelectOption
} from "@/types/project-config";
import { http } from "@/lib/http";

/**
 * 项目配置服务实现类
 * 实现了IProjectConfigService接口，提供完整的项目配置API调用功能
 */
class ProjectConfigService implements IProjectConfigService {
  /**
   * API基础路径
   * @private
   */
  private readonly BASE_PATH = "/project-config";

  getProjectConfig = async (params: IProjectConfigParams): Promise<IProjectConfigResponse> => {
    try {
      const response = await http.get<IProjectConfigResponse>(`${this.BASE_PATH}/getProjectConfigSimple`, {
        params
      });
      return response;
    } catch (error) {
      console.error("获取项目配置数据失败:", error);
      throw new Error(`获取项目配置数据失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  };

  getProjectTypeOptions = async (): Promise<SelectOption[]> => {
    try {
      const response = await this.getProjectConfig({ configTypes: "project-type,design-phases" });
      const projectTypes = response["project-type"];

      if (!Array.isArray(projectTypes)) {
        console.warn("项目类型数据格式不正确，返回空数组");
        return [];
      }

      return projectTypes;
    } catch (error) {
      console.error("获取项目类型选项失败:", error);
      throw new Error(`获取项目类型选项失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  };

  getDesignStageOptions = async (): Promise<SelectOption[]> => {
    try {
      const response = await this.getProjectConfig({ configTypes: "design-phases" });
      const designStages = response["design-phases"] || [];

      return designStages;
    } catch (error) {
      console.error("获取设计阶段选项失败:", error);
      throw new Error(`获取设计阶段选项失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  };

  /**
   * 获取参数分类选项列表
   * 通过统一接口获取参数分类配置数据
   * @returns Promise<SelectOption[]> 参数分类选项数组
   */
  getParameterClassifyOptions = async (): Promise<SelectOption[]> => {
    try {
      const response = await this.getProjectConfig({ configTypes: "parameter-classify" });
      const parameterClassify = response["parameter-classify"] || [];

      return parameterClassify;
    } catch (error) {
      console.error("获取参数分类选项失败:", error);
      throw new Error(`获取参数分类选项失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  };

  /**
   * 获取评审环节选项列表
   * 通过统一接口获取评审环节配置数据
   * @returns Promise<SelectOption[]> 评审环节选项数组
   */
  getReviewStageOptions = async (): Promise<SelectOption[]> => {
    try {
      const response = await this.getProjectConfig({ configTypes: "review-stage" });
      const reviewStage = response["review-stage"] || [];

      return reviewStage;
    } catch (error) {
      console.error("获取评审环节选项失败:", error);
      throw new Error(`获取评审环节选项失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  };

  /**
   * 获取材料目录选项数据
   * @returns Promise<SelectOption[]> 材料目录选项列表
   */
  getMaterialDirectoryOptions = async (): Promise<SelectOption[]> => {
    try {
      const response = await this.getProjectConfig({
        configTypes: "material-directory"
      });
      return response["material-directory"] || [];
    } catch (error) {
      console.error("获取材料目录选项失败:", error);
      throw new Error(`获取材料目录选项失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  };

  /**
   * 获取工程层级选项数据
   * @returns Promise<SelectOption[]> 工程层级选项列表
   */
  getEngineerLevelOptions = async (): Promise<SelectOption[]> => {
    try {
      const response = await this.getProjectConfig({
        configTypes: "engineer-level"
      });
      return response["engineer-level"] || [];
    } catch (error) {
      console.error("获取工程层级选项失败:", error);
      throw new Error(`获取工程层级选项失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  };

  /**
   * 获取工程类别选项数据
   * @returns Promise<SelectOption[]> 工程类别选项列表
   */
  getEngineeringCategoryOptions = async (): Promise<SelectOption[]> => {
    try {
      const response = await this.getProjectConfig({
        configTypes: "engineering-category"
      });
      return response["engineering-category"] || [];
    } catch (error) {
      console.error("获取工程类别选项失败:", error);
      throw new Error(`获取工程类别选项失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  };

  /**
   * 获取数据类型选项数据
   * @returns Promise<SelectOption[]> 数据类型选项列表
   */
  getDataTypeOptions = async (): Promise<SelectOption[]> => {
    try {
      const response = await this.getProjectConfig({
        configTypes: "data-type"
      });
      return response["data-type"] || [];
    } catch (error) {
      console.error("获取数据类型选项失败:", error);
      throw new Error(`获取数据类型选项失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  };

  /**
   * 获取表单所需的多个配置选项
   * 一次请求获取参数分类和评审环节数据，减少API调用次数
   * @returns Promise<{parameterClassify: IParameterClassifyOption[], reviewStage: IReviewStageOption[]}> 表单配置数据
   */
  getFormConfigOptions = async (): Promise<{
    parameterClassify: SelectOption[];
    reviewStage: SelectOption[];
  }> => {
    try {
      const response = await this.getProjectConfig({ configTypes: "parameter-classify,review-stage" });
      return {
        parameterClassify: response["parameter-classify"] || [],
        reviewStage: response["review-stage"] || []
      };
    } catch (error) {
      console.error("获取表单配置选项失败:", error);
      throw new Error(`获取表单配置选项失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  };

  /**
   * 获取指标管理表单的所有配置选项（统一接口）
   * 基于用户提供的接口示例重新组织
   */
  getIndicatorFormAllConfigOptions = async (): Promise<FormAllConfigOptionsResponse> => {
    try {
      const response = await this.getProjectConfig({
        configTypes:
          "parameter-classify,review-stage,material-directory,engineer-level,engineering-category,data-type,major-categories,applicable-conditions,design-phases"
      });

      return {
        parameterClassify: response["parameter-classify"] || [],
        reviewStage: response["review-stage"] || [],
        materialDirectory: response["material-directory"] || [],
        engineerLevel: response["engineer-level"] || [],
        engineeringCategory: response["engineering-category"] || [],
        dataType: response["data-type"] || [],
        majorCategories: response["major-categories"] || [],
        applicableConditions: response["applicable-conditions"] || [],
        designStage: response["design-phases"] || []
      };
    } catch (error) {
      console.error("获取指标表单配置选项失败:", error);
      throw new Error(`获取指标表单配置选项失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  };
}

export const projectConfigService = new ProjectConfigService();

/**
 * 默认导出项目配置服务实例
 * 提供默认导出方式，方便不同的导入习惯
 */
export default projectConfigService;

/**
 * 导出项目配置服务类
 * 如果需要创建多个实例或进行扩展，可以导入该类
 */
export { ProjectConfigService };
