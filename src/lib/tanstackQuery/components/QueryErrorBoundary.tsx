/**
 * 查询错误边界组件模块
 * 捕获查询错误并显示友好的错误 UI，提供重试和重置功能，支持根据错误类型显示不同提示
 */

import type { ReactNode } from "react";

import type { ErrorBoundaryProps } from "@/components/common";

import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/common";

/**
 * 查询错误边界组件属性
 * @property {ReactNode} children - 子组件
 * @property {(error: Error, resetErrorBoundary: () => void) => ReactNode} [fallback] - 自定义错误回退 UI 函数
 * @property {(error: Error, errorInfo: { componentStack: string }) => void} [onError] - 错误回调函数
 * @property {Array<string | number>} [resetKeys] - 重置键数组，当这些键变化时会重置错误状态
 */
export interface QueryErrorBoundaryProps extends Omit<ErrorBoundaryProps, "onReset"> {
  children: ReactNode;
  fallback?: (error: Error, resetErrorBoundary: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
  resetKeys?: Array<string | number>;
}

/**
 * 查询错误边界组件
 * 包装 TanStack Query 的 QueryErrorResetBoundary，提供查询错误的捕获和重置功能
 *
 * @param {QueryErrorBoundaryProps} props - 组件属性
 * @returns {JSX.Element} 错误边界组件
 */
export function QueryErrorBoundary({ children, fallback, onError, resetKeys, ...props }: QueryErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          fallback={fallback || QueryErrorFallback}
          onError={onError}
          onReset={reset}
          resetKeys={resetKeys}
          {...props}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

/**
 * 默认查询错误回退组件
 * 显示通用错误提示 UI，提供重新加载和刷新页面按钮
 *
 * @param {Error} error - 错误对象
 * @param {() => void} resetErrorBoundary - 重置错误边界的函数
 * @returns {JSX.Element} 错误回退 UI
 */
export function QueryErrorFallback(error: Error, resetErrorBoundary: () => void) {
  return (
    <div className="flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="mb-4">
          <div className="w-12 h-12 mx-auto mb-3 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-foreground mb-2">查询失败</h3>

        <p className="text-sm text-muted-foreground mb-4">{error.message || "数据加载失败，请稍后重试"}</p>

        <div className="space-x-2">
          <button
            onClick={resetErrorBoundary}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-colors text-sm font-medium"
          >
            重新加载
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors text-sm font-medium"
          >
            刷新页面
          </button>
        </div>

        {import.meta.env.DEV && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              查看技术详情
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs text-foreground overflow-auto max-h-32">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

/**
 * 增强查询错误回退组件
 * 根据错误类型显示不同 UI（网络错误、401、403、404、500 等）
 *
 * @param {object} props - 组件属性
 * @param {Error} props.error - 错误对象
 * @param {() => void} props.resetErrorBoundary - 重置错误边界的函数
 * @returns {JSX.Element} 错误回退 UI
 */
export function EnhancedQueryErrorFallback({
  error,
  resetErrorBoundary
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  const errorMessage = error.message.toLowerCase();

  // 网络错误
  if (errorMessage.includes("network") || errorMessage.includes("fetch") || errorMessage.includes("failed to fetch")) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <div className="w-12 h-12 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                />
              </svg>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-2">网络连接失败</h3>

          <p className="text-sm text-muted-foreground mb-4">无法连接到服务器，请检查您的网络连接后重试</p>

          <div className="space-x-2">
            <button
              onClick={resetErrorBoundary}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-colors text-sm font-medium"
            >
              重新连接
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 权限错误 (401)
  if (errorMessage.includes("401") || errorMessage.includes("unauthorized")) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <div className="w-12 h-12 mx-auto mb-3 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-2">需要登录</h3>

          <p className="text-sm text-muted-foreground mb-4">您需要登录才能访问此内容</p>

          <div className="space-x-2">
            <button
              onClick={() => (window.location.href = "/login")}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-colors text-sm font-medium"
            >
              前往登录
            </button>
            <button
              onClick={resetErrorBoundary}
              className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors text-sm font-medium"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 权限错误 (403)
  if (errorMessage.includes("403") || errorMessage.includes("forbidden")) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <div className="w-12 h-12 mx-auto mb-3 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-2">没有访问权限</h3>

          <p className="text-sm text-muted-foreground mb-4">您没有权限访问此内容，如需帮助请联系管理员</p>

          <div className="space-x-2">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors text-sm font-medium"
            >
              返回
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 404 错误
  if (errorMessage.includes("404") || errorMessage.includes("not found")) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <div className="w-12 h-12 mx-auto mb-3 bg-muted rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-2">内容不存在</h3>

          <p className="text-sm text-muted-foreground mb-4">请求的内容不存在或已被删除</p>

          <div className="space-x-2">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-colors text-sm font-medium"
            >
              返回
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 服务器错误 (500)
  if (errorMessage.includes("500") || errorMessage.includes("server") || errorMessage.includes("internal")) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <div className="w-12 h-12 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-2">服务器错误</h3>

          <p className="text-sm text-muted-foreground mb-4">服务器遇到了问题，请稍后重试</p>

          <div className="space-x-2">
            <button
              onClick={resetErrorBoundary}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 通用错误 - 使用默认的 QueryErrorFallback
  return QueryErrorFallback(error, resetErrorBoundary);
}

/**
 * 轻量级查询错误边界
 * 简化版错误边界，使用默认错误回退 UI
 *
 * @param {object} props - 组件属性
 * @param {ReactNode} props.children - 子组件
 * @param {(error: Error, errorInfo: { componentStack: string }) => void} [props.onError] - 错误回调函数
 * @returns {JSX.Element} 错误边界组件
 */
export function LightQueryErrorBoundary({
  children,
  onError
}: {
  children: ReactNode;
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
}) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary fallback={QueryErrorFallback} onError={onError} onReset={reset}>
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
