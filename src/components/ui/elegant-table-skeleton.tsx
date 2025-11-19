import { cn } from "@/lib/utils";

interface ElegantTableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
  columnWidths?: string[];
  headerHeight?: string;
  rowHeight?: string;
}

export function ElegantTableSkeleton({
  rows = 5,
  columns = 2,
  showHeader = true,
  className,
  columnWidths,
  headerHeight = "h-12",
  rowHeight = "h-16"
}: ElegantTableSkeletonProps) {
  // 默认列宽分配
  const defaultColumnWidths =
    columnWidths ||
    (columns === 2
      ? ["flex-1", "w-24"]
      : Array.from({ length: columns }).map((_, i) => (i === columns - 1 ? "w-24" : "flex-1")));

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* 表头骨架 */}
      {showHeader && (
        <div className={cn("flex items-center gap-4 px-6 py-3 bg-muted rounded-xl border border-border", headerHeight)}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={`header-${colIndex}`}
              className={cn(
                "relative overflow-hidden rounded-lg bg-input h-6 animate-pulse",
                defaultColumnWidths[colIndex]
              )}
            />
          ))}
        </div>
      )}

      {/* 表格行骨架 */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className={cn(
              "flex items-center gap-4 px-6 py-4 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 animate-pulse",
              rowHeight
            )}
            style={{
              animationDelay: `${rowIndex * 100}ms`
            }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={`cell-${rowIndex}-${colIndex}`} className={cn(defaultColumnWidths[colIndex])}>
                {/* 表行样式和表头保持一致，都是长条形 */}
                <div className={cn("relative overflow-hidden rounded-lg bg-input h-6 animate-pulse")} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
