import type { ColumnDef } from "@tanstack/react-table";
import type { IIndicatorItem, IIndicatorQueryParams } from "../types";
import { QueryErrorBoundary } from "@qiaopeng/tanstack-query-plus/components";
import { Suspense } from "react";
import { QueryErrorCard } from "@/components/common/QueryErrorCard";
import { DataTable } from "@/components/Table/Data-table";
import { ElegantTableSkeleton } from "@/components/ui/elegant-table-skeleton";
import { useListSuspenseQuery } from "../api";

// ==================== 骨架屏组件 ====================
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ElegantTableSkeleton
      rows={rows}
      columns={2}
      columnWidths={["flex-1", "w-20"]}
      showHeader={true}
      headerHeight="h-14"
      rowHeight="h-[4.5rem]"
    />
  );
}

// ==================== 列表内容组件（使用 Suspense）====================
interface ListContentProps {
  queryParams: IIndicatorQueryParams;
  columns: ColumnDef<IIndicatorItem>[];
}

function ListContent({ queryParams, columns }: ListContentProps) {
  // 使用 Suspense Query - 数据一定有值，不需要判断 isLoading
  const { data } = useListSuspenseQuery(queryParams);

  return <DataTable columns={columns} data={data.Rows} total={data.Total} />;
}

// ==================== 表格区域组件 ====================
interface TableSectionProps {
  queryParams: IIndicatorQueryParams;
  columns: ColumnDef<IIndicatorItem>[];
}

/**
 * 表格区域 - 纯渲染组件
 */
export function TableSection({ queryParams, columns }: TableSectionProps) {
  "use no memo";
  return (
    <div className="flex-1 min-h-0 overflow-hidden p-4 bg-card">
      <div className="h-full overflow-hidden">
        <QueryErrorBoundary
          fallback={(error, reset) => (
            <QueryErrorCard title="加载列表失败" message={error.message} onRetry={reset} retryText="重试" />
          )}
          resetKeys={[JSON.stringify(queryParams)]}
        >
          <Suspense fallback={<TableSkeleton />}>
            <ListContent queryParams={queryParams} columns={columns} />
          </Suspense>
        </QueryErrorBoundary>
      </div>
    </div>
  );
}
