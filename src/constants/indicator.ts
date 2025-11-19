/**
 * 全局：指标状态常量与辅助方法
 * 说明：抽象为全局可复用的常量，供各模块统一使用
 */

/**
 * 指标状态枚举及辅助方法
 * - Disabled: 0
 * - Enabled: 1
 * - 提供切换、判断、标签与样式等通用方法
 */
export const IndicatorStatus = {
  Disabled: 0,
  Enabled: 1,
  /**
   * 切换状态
   * @param current 当前状态
   * @returns 切换后的状态
   */
  toggle: (current: number) => (current === 1 ? 0 : 1),
  /**
   * 判断是否启用
   * @param status 状态值
   * @returns 是否启用
   */
  isEnabled: (status: number) => status === 1,
  /**
   * 获取状态标签
   * @param status 状态值
   * @returns 状态标签文本
   */
  getLabel: (status: number) => (status === 1 ? "已启用" : "已禁用"),
  /**
   * 获取状态样式类名
   * @param status 状态值
   * @returns Tailwind CSS 类名
   */
  getClassName: (status: number) => (status === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")
} as const;

export type IndicatorStatusValue = typeof IndicatorStatus.Disabled | typeof IndicatorStatus.Enabled;
