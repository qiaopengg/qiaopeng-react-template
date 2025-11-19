/**
 * TanStack Query 组件统一导出
 * 包含加载占位、持久化提供者、错误边界、Suspense 包装器
 */

// LoadingFallback components
export {
  CardSkeletonFallback,
  DefaultLoadingFallback,
  FullScreenLoading,
  ListSkeletonFallback,
  PageSkeletonFallback,
  SmallLoadingIndicator,
  TextSkeletonFallback
} from "./LoadingFallback";

// QueryErrorBoundary
export { QueryErrorBoundary, type QueryErrorBoundaryProps } from "./QueryErrorBoundary";

// SuspenseWrapper
export { SuspenseWrapper, type SuspenseWrapperProps } from "./SuspenseWrapper";
