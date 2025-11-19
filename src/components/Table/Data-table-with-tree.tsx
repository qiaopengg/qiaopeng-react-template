import type { ColumnDef } from "@tanstack/react-table";
import { flexRender, getCoreRowModel, getExpandedRowModel, useReactTable } from "@tanstack/react-table";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTablePagination } from "./Data-pagination";
import "@/types/table.d.ts";

// 树形数据节点接口
interface TreeNode {
  id: number | string;
  children?: TreeNode[];
  [key: string]: any;
}

interface DataTableWithTreeProps<TData extends TreeNode, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  ref?: React.Ref<DataTableWithTreeRef<TData>>;
  total?: number;
  showPagination?: boolean;
  style?: { header?: string; body?: string };
  childrenKey?: string; // 子节点字段名，默认为 'children'
  expandable?: boolean; // 是否可展开，默认为 true
  defaultExpanded?: boolean; // 默认是否展开所有节点
}

export interface DataTableWithTreeRef<TData> {
  table: ReturnType<typeof useReactTable<TData>>;
}

export function DataTableWithTree<TData extends TreeNode, TValue>({
  columns,
  data,
  ref,
  total = 0,
  showPagination = true,
  style = {},
  childrenKey = "children",
  expandable = true,
  defaultExpanded = false
}: DataTableWithTreeProps<TData, TValue>) {
  "use no memo";
  const [rowSelection, setRowSelection] = useState({});

  // 创建带展开功能的列定义
  const enhancedColumns = useMemo(() => {
    if (!expandable) return columns;

    // 修改第一列，添加展开功能和层级缩进
    const modifiedColumns = [...columns];
    if (modifiedColumns.length > 0) {
      const firstColumn = { ...modifiedColumns[0] };
      const originalCell = firstColumn.cell;

      firstColumn.cell = (props) => {
        const { row } = props;
        const canExpand = row.getCanExpand();
        const depth = row.depth;

        return (
          <div className="flex items-center" style={{ paddingLeft: `${depth * 20}px` }}>
            {canExpand ? (
              <button
                onClick={row.getToggleExpandedHandler()}
                className="p-1 hover:bg-muted rounded transition-colors mr-2"
                aria-label={row.getIsExpanded() ? "收起" : "展开"}
              >
                {row.getIsExpanded() ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ) : (
              <div className="w-6 h-6 mr-2" />
            )}
            <div>
              {originalCell
                ? typeof originalCell === "function"
                  ? originalCell(props)
                  : originalCell
                : props.getValue()}
            </div>
          </div>
        );
      };

      modifiedColumns[0] = firstColumn;
    }

    return modifiedColumns;
  }, [columns, expandable]);

  const table = useReactTable({
    data: data as TData[],
    columns: enhancedColumns as ColumnDef<TData, TValue>[],
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: (row: TData) => {
      const children = row[childrenKey] as TData[] | undefined;
      return children || [];
    },
    onRowSelectionChange: setRowSelection,
    initialState: {
      expanded: defaultExpanded ? true : {}
    },
    state: {
      rowSelection
    }
  });

  useImperativeHandle(ref, () => {
    return { table };
  }, [table]);

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
                <TableCell colSpan={enhancedColumns.length} className="h-24 text-center">
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
