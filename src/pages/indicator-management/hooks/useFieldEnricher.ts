/**
 * 指标管理模块的字段映射工具
 *
 * 核心功能：将 ID 字段转换为对应的名称字段
 */

import { createFieldEnricher } from "@qiaopeng/tanstack-query-plus/utils";
import { indicatorKeys } from "../shared";

/**
 * 补全名称字段
 *
 * 使用通用的字段映射工具，配置指标模块特定的映射规则
 */
export const enrichNameFields = createFieldEnricher(indicatorKeys.formConfig(), {
  engineerLevel: {
    nameField: "engineerLevelName",
    configKey: "engineerLevel"
  },
  parameterClassifyId: {
    nameField: "parameterClassifyName",
    configKey: "parameterClassify"
  },
  dataType: {
    nameField: "dataTypeName",
    configKey: "dataType"
  }
});
