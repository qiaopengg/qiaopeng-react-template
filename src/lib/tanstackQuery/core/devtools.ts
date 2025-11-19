/**
 * React Query DevTools 配置
 * 提供开发工具配置和管理
 */

// 注意：在浏览器环境下不要使用 Node 的 process 模块。
// 使用 Vite 提供的 import.meta.env 来判断当前环境。

export { ReactQueryDevtools } from "@tanstack/react-query-devtools";

/**
 * DevTools 配置选项
 * @property {boolean} [initialIsOpen=false] - 初始是否打开
 * @property {"top-left" | "top-right" | "bottom-left" | "bottom-right"} [position] - 面板位置
 * @property {boolean} [enabled] - 是否启用，默认仅非生产环境（开发/测试）
 * @property {"top-left" | "top-right" | "bottom-left" | "bottom-right"} [buttonPosition] - 按钮位置
 * @property {React.ComponentProps<"div">} [panelProps] - 面板样式
 * @property {React.ComponentProps<"button">} [closeButtonProps] - 关闭按钮样式
 * @property {React.ComponentProps<"button">} [toggleButtonProps] - 切换按钮样式
 */
export interface DevToolsConfig {
  initialIsOpen?: boolean;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  enabled?: boolean;
  buttonPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  panelProps?: React.ComponentProps<"div">;
  closeButtonProps?: React.ComponentProps<"button">;
  toggleButtonProps?: React.ComponentProps<"button">;
}

/** 默认 DevTools 配置 */
export const defaultDevToolsConfig: DevToolsConfig = {
  initialIsOpen: false,
  position: "bottom-right",
  // 在非生产环境启用 DevTools（开发/测试）
  enabled: import.meta.env.MODE !== "production"
};

/**
 * 创建自定义 DevTools 配置
 * 合并默认配置和自定义覆盖项
 *
 * @param {Partial<DevToolsConfig>} [overrides] - 配置覆盖项
 * @returns {DevToolsConfig} 合并后的配置
 */
export function createDevToolsConfig(overrides?: Partial<DevToolsConfig>): DevToolsConfig {
  return {
    ...defaultDevToolsConfig,
    ...overrides
  };
}

/**
 * 检查 DevTools 是否应该启用
 * 仅在非生产环境启用（开发/测试）
 *
 * @returns {boolean} 是否启用
 */
export function isDevToolsEnabled(): boolean {
  return import.meta.env.MODE !== "production";
}
