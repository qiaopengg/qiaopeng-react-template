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
  total?: number; // 服务端分页的总数
  showPagination?: boolean; // 是否显示分页，默认为 true
  style?: { header?: string; body?: string }; // 可选的样式对象，包含 header 属性
}

export interface DataTableRef<TData> {
  table: ReturnType<typeof useReactTable<TData>>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  ref,
  total = 0,
  showPagination = true,
  style = {}
}: DataTableProps<TData, TValue>) {
  "use no memo";
  const [rowSelection, setRowSelection] = useState({});
  const containerRef = useRef<HTMLDivElement>(null);
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);
  const [shouldFixPagination, setShouldFixPagination] = useState(false);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // 对于服务端分页，我们不需要客户端分页
    // getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection
    }
  });

  useImperativeHandle(ref, () => {
    return { table };
  }, [table]);

  // 检测是否需要固定分页器
  useEffect(() => {
    const checkOverflow = () => {
      if (!containerRef.current || !tableWrapperRef.current || !paginationRef.current) {
        return;
      }

      const containerHeight = containerRef.current.clientHeight;
      const tableHeight = tableWrapperRef.current.scrollHeight;
      const paginationHeight = paginationRef.current.clientHeight;

      // 如果表格内容 + 分页器高度 > 容器高度，则固定分页器
      setShouldFixPagination(tableHeight + paginationHeight + 8 > containerHeight);
    };

    checkOverflow();

    // 监听窗口大小变化
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
      {/* Table 容器 - 可滚动区域 */}
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
                      style={{
                        width: header.column.columnDef.meta?.width ? `${header.column.columnDef.meta.width}px` : "auto"
                      }}
                      key={header.id}
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
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-center">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
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

      {/* 分页器 - 智能定位 */}
      {showPagination && (
        <div ref={paginationRef}>
          <DataTablePagination total={total} />
        </div>
      )}
    </div>
  );
}
