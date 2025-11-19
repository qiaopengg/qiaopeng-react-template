/**
 * Suspense 包装组件模块
 * 提供 Suspense 和 ErrorBoundary 的集成包装，统一处理加载状态和错误状态
 */

import type { ReactNode } from "react";
import { Suspense } from "react";

import { QueryErrorBoundary } from "./QueryErrorBoundary";

/**
 * Suspense 包装器属性
 * @property {ReactNode} children - 子组件
 * @property {ReactNode} [fallback] - 加载状态的回退 UI
 * @property {(error: Error, resetErrorBoundary: () => void) => ReactNode} [errorFallback] - 错误状态的回退 UI 函数
 * @property {(error: Error, errorInfo: { componentStack: string }) => void} [onError] - 错误回调函数
 * @property {Array<string | number>} [resetKeys] - 重置键数组
 */
interface SuspenseWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: (error: Error, resetErrorBoundary: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
  resetKeys?: Array<string | number>;
}

/**
 * Suspense 包装组件
 * 集成 QueryErrorBoundary 和 Suspense，同时处理加载状态和错误状态
 *
 * @param {SuspenseWrapperProps} props - 组件属性
 * @returns {JSX.Element} Suspense 包装组件
 */
export function SuspenseWrapper({
  children,
  fallback = <div>Loading...</div>,
  errorFallback,
  onError,
  resetKeys
}: SuspenseWrapperProps) {
  return (
    <QueryErrorBoundary fallback={errorFallback} onError={onError} resetKeys={resetKeys}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </QueryErrorBoundary>
  );
}

/**
 * 查询专用的 Suspense 包装器
 * 专门用于包装使用 TanStack Query 的组件，是 SuspenseWrapper 的语义化别名
 *
 * @param {SuspenseWrapperProps} props - 组件属性
 * @returns {JSX.Element} Suspense 包装组件
 */
export function QuerySuspenseWrapper({
  children,
  fallback = <div>Loading query...</div>,
  errorFallback,
  onError,
  resetKeys
}: SuspenseWrapperProps) {
  return (
    <SuspenseWrapper fallback={fallback} errorFallback={errorFallback} onError={onError} resetKeys={resetKeys}>
      {children}
    </SuspenseWrapper>
  );
}

export type { SuspenseWrapperProps };
