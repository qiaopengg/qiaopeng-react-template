/**
 * 加载回退组件集合
 * 提供多种加载状态 UI 组件：默认加载器、骨架屏、全屏加载
 */

/**
 * 默认加载回退组件
 * 显示旋转加载指示器和文本
 */
export function DefaultLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-3 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">加载中...</p>
      </div>
    </div>
  );
}

/**
 * 文本骨架屏组件
 * 用于纯文本块/段落的加载占位，不适合表格或复杂页面布局
 * @param {number} [lines] - 文本段落数
 */
export function TextSkeletonFallback({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-input rounded w-3/4 mb-2" />
          <div className="h-4 bg-input rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

/**
 * 卡片骨架屏组件
 * 显示卡片样式的骨架屏
 */
export function CardSkeletonFallback() {
  return (
    <div className="border border-border rounded-lg p-4 animate-pulse bg-card">
      <div className="h-6 bg-input rounded w-1/2 mb-4" />
      <div className="space-y-2">
        <div className="h-4 bg-input rounded" />
        <div className="h-4 bg-input rounded w-5/6" />
        <div className="h-4 bg-input rounded w-4/6" />
      </div>
    </div>
  );
}

/**
 * 列表骨架屏组件
 * 显示列表样式的骨架屏
 * @param {number} [items] - 列表项数
 */
export function ListSkeletonFallback({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 animate-pulse">
          {/* 缩略图 */}
          <div className="w-12 h-12 bg-input rounded-full shrink-0" />

          {/* 内容 */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-input rounded w-3/4" />
            <div className="h-3 bg-input rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 页面骨架屏组件
 * 显示完整页面布局的骨架屏
 */
export function PageSkeletonFallback() {
  return (
    <div className="w-full p-6 space-y-6">
      {/* 页面标题 */}
      <div className="animate-pulse">
        <div className="h-8 bg-input rounded w-1/3 mb-2" />
        <div className="h-4 bg-input rounded w-1/2" />
      </div>

      {/* 内容区域 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 主内容 */}
        <div className="md:col-span-2 space-y-4">
          <CardSkeletonFallback />
          <CardSkeletonFallback />
        </div>

        {/* 侧边栏 */}
        <div className="space-y-4">
          <div className="border border-border rounded-lg p-4 animate-pulse bg-card">
            <div className="h-4 bg-input rounded w-2/3 mb-3" />
            <div className="space-y-2">
              <div className="h-3 bg-input rounded" />
              <div className="h-3 bg-input rounded w-5/6" />
              <div className="h-3 bg-input rounded w-4/6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 小型加载指示器
 * 显示不同尺寸的旋转加载器
 * @param {"sm" | "md" | "lg"} [size] - 尺寸大小
 */
export function SmallLoadingIndicator({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-8 h-8 border-3"
  };

  return <div className={`${sizeClasses[size]} border-primary/20 border-t-primary rounded-full animate-spin`} />;
}

/**
 * 全屏加载组件
 * 显示全屏遮罩的加载状态
 * @param {string} [message] - 加载提示文本
 */
export function FullScreenLoading({ message = "加载中..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-background/90 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-lg text-foreground">{message}</p>
      </div>
    </div>
  );
}
