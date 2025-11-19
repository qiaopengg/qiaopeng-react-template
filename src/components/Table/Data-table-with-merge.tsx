import type { ColumnDef } from "@tanstack/react-table";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useEffect, useImperativeHandle, useRef, useState } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTablePagination } from "./Data-pagination";
import "@/types/table.d.ts";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  ref?: React.Ref<DataTableRef<TData>>;
  total?: number;
  showPagination?: boolean;
  style?: { header?: string; body?: string };
  // 新增：单元格合并配置
  mergeCells?: {
    // 需要合并的列的 accessorKey
    columnKey: string;
    // 合并逻辑：返回相同值的行会被合并
    groupBy: (row: TData) => string | number;
    // 可选：是否为合并单元格添加右边框
    showRightBorder?: boolean;
  }[];
}

export interface DataTableRef<TData> {
  table: ReturnType<typeof useReactTable<TData>>;
}

export function DataTableWithMerge<TData, TValue>({
  columns,
  data,
  ref,
  total = 0,
  showPagination = true,
  style = {},
  mergeCells = []
}: DataTableProps<TData, TValue>) {
  "use no memo";
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection
    }
  });

  useImperativeHandle(ref, () => {
    return { table };
  }, [table]);

  // 计算单元格合并信息
  const calculateMergeInfo = () => {
    const rows = table.getRowModel().rows;
    const mergeInfo: Record<string, Record<number, { rowSpan: number; skip: boolean }>> = {};

    mergeCells.forEach(({ columnKey, groupBy }) => {
      mergeInfo[columnKey] = {};
      let currentGroup: string | number | null = null;
      let groupStartIndex = 0;
      let groupSize = 0;

      rows.forEach((row, index) => {
        const groupValue = groupBy(row.original);

        if (currentGroup === null || currentGroup !== groupValue) {
          // 新组开始，先处理上一组
          if (currentGroup !== null && groupSize > 1) {
            mergeInfo[columnKey][groupStartIndex] = { rowSpan: groupSize, skip: false };
            for (let i = groupStartIndex + 1; i < groupStartIndex + groupSize; i++) {
              mergeInfo[columnKey][i] = { rowSpan: 1, skip: true };
            }
          } else if (currentGroup !== null) {
            mergeInfo[columnKey][groupStartIndex] = { rowSpan: 1, skip: false };
          }

          // 开始新组
          currentGroup = groupValue;
          groupStartIndex = index;
          groupSize = 1;
        } else {
          // 同一组
          groupSize++;
        }
      });

      // 处理最后一组
      if (currentGroup !== null && groupSize > 1) {
        mergeInfo[columnKey][groupStartIndex] = { rowSpan: groupSize, skip: false };
        for (let i = groupStartIndex + 1; i < groupStartIndex + groupSize; i++) {
          mergeInfo[columnKey][i] = { rowSpan: 1, skip: true };
        }
      } else if (currentGroup !== null) {
        mergeInfo[columnKey][groupStartIndex] = { rowSpan: 1, skip: false };
      }
    });

    return mergeInfo;
  };

  const mergeInfo = calculateMergeInfo();

  const containerRef = useRef<HTMLDivElement>(null);
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);
  const [shouldFixPagination, setShouldFixPagination] = useState(false);

  // 检测是否需要固定分页器
  useEffect(() => {
    const checkOverflow = () => {
      if (!containerRef.current || !tableWrapperRef.current || !paginationRef.current) {
        return;
      }

      const containerHeight = containerRef.current.clientHeight;
      const tableHeight = tableWrapperRef.current.scrollHeight;
      const paginationHeight = paginationRef.current.clientHeight;

      setShouldFixPagination(tableHeight + paginationHeight + 8 > containerHeight);
    };

    checkOverflow();

    const resizeObserver = new ResizeObserver(checkOverflow);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [data]);

  return (
    <div
      ref={containerRef}
      className="relative h-full"
      style={{
        display: "grid",
        gridTemplateRows: shouldFixPagination ? "1fr auto" : "auto auto",
        gap: "0.5rem"
      }}
    >
      <div
        ref={tableWrapperRef}
        className="overflow-auto rounded-md border border-border"
        style={{
          minHeight: shouldFixPagination ? 0 : "auto"
        }}
      >
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/80">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b hover:bg-transparent">
                {headerGroup.headers.map((header, idx) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{
                        width: header.column.columnDef.meta?.width ? `${header.column.columnDef.meta.width}px` : "auto"
                      }}
                      className={`text-center ${
                        idx === 0 ? "rounded-tl-md" : idx === headerGroup.headers.length - 1 ? "rounded-tr-md" : ""
                      } ${style.header ?? ""}`}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className={`[&_tr:last-child]:border-b ${style.body}`}>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, rowIndex) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => {
                    const columnKey = cell.column.id;
                    const cellMergeInfo = mergeInfo[columnKey]?.[rowIndex];

                    // 如果这个单元格应该被跳过（因为被上面的单元格合并了）
                    if (cellMergeInfo?.skip) {
                      return null;
                    }

                    // 为合并单元格添加特殊样式
                    const isMergedCell = cellMergeInfo && cellMergeInfo.rowSpan > 1;
                    const mergeConfig = mergeCells.find((config) => config.columnKey === columnKey);
                    const shouldShowRightBorder = isMergedCell && mergeConfig?.showRightBorder;

                    return (
                      <TableCell
                        key={cell.id}
                        className={`text-center ${shouldShowRightBorder ? "border-r-1 border-border" : ""}`}
                        rowSpan={cellMergeInfo?.rowSpan || 1}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {showPagination && (
        <div ref={paginationRef}>
          <DataTablePagination total={total} />
        </div>
      )}
    </div>
  );
}
