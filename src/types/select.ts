/**
 * 通用选择项类型定义（公共类型）
 * - BaseSelectOption：业务层/服务层统一的基础选项结构
 * - UISelectOption：UI 组件层（AdvancedSelect 等）使用的扩展选项结构
 * - CascadingOption：级联选择组件使用的选项结构（支持禁用）
 */

export interface BaseSelectOption<V extends string | number = string | number> {
  /** 选项值 */
  value: V;
  /** 选项标签 */
  label: string;
  /** 子选项（用于树形结构） */
  children?: BaseSelectOption<V>[];
}

export interface UISelectOption<V extends string | number = string | number> extends BaseSelectOption<V> {
  /** 是否禁用 */
  disabled?: boolean;
  /** 选项描述 */
  description?: string;
  /** 分组名称 */
  group?: string;
  /** 搜索关键词（用于本地搜索增强） */
  searchKeywords?: string[];
}

export interface CascadingOption<V extends string | number = string | number> extends BaseSelectOption<V> {
  /** 是否禁用 */
  disabled?: boolean;
}
