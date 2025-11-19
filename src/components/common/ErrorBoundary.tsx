/**
 * 通用错误边界组件
 * 职责：提供通用的 React 错误边界功能，不依赖于特定的查询库
 */

import type { ReactNode } from "react";
import { Component } from "react";

import { Button } from "@/components/ui/button";

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, resetErrorBoundary: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
  onReset?: () => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * 通用错误边界组件
 * 可以捕获组件树中的任何 JavaScript 错误
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    // 调用错误回调
    this.props.onError?.(error, errorInfo);

    // 在开发环境下打印错误信息
    if (import.meta.env.DEV) {
      console.error("🚨 ErrorBoundary 捕获到错误:", error);
      console.error("📍 组件堆栈:", errorInfo.componentStack);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // 如果有错误且 resetKeys 发生变化，自动重置
    if (hasError && resetKeys && prevProps.resetKeys !== resetKeys) {
      if (resetKeys.some((key, idx) => prevProps.resetKeys?.[idx] !== key)) {
        this.resetErrorBoundary();
      }
    }

    // 如果启用了 props 变化重置且 children 发生变化
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.resetTimeoutId = window.setTimeout(() => {
      this.props.onReset?.();
      this.setState({ hasError: false, error: undefined });
    }, 0);
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // 如果提供了自定义 fallback，使用它
      if (fallback) {
        return fallback(error, this.resetErrorBoundary);
      }

      // 默认的错误 UI
      return <DefaultErrorFallback error={error} resetErrorBoundary={this.resetErrorBoundary} />;
    }

    return children;
  }
}

/**
 * 默认的错误回退组件
 */
export function DefaultErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-destructive/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-foreground mb-2">出现了一个错误</h3>

        <p className="text-sm text-muted-foreground mb-4">{error.message || "发生了未知错误，请稍后重试"}</p>

        <div className="space-x-3">
          <Button onClick={resetErrorBoundary} variant="default">
            重试
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline">
            刷新页面
          </Button>
        </div>

        {import.meta.env.DEV && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              查看错误详情
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded text-xs text-foreground overflow-auto">{error.stack}</pre>
          </details>
        )}
      </div>
    </div>
  );
}

/**
 * 高阶组件：为组件添加错误边界
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
