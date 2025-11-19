import type { ColumnDef } from "@tanstack/react-table";
import type { IIndicatorItem } from "../types";
import { Edit, MoreHorizontal, Power, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { IndicatorStatus } from "@/constants/indicator";

/**
 * 表格列定义 Hook
 */
export function useTableColumns(
  onEdit: (item: IIndicatorItem) => void,
  onDelete: (item: IIndicatorItem) => void,
  onToggleStatus: (item: IIndicatorItem) => void,
  onPrefetchFormConfig: () => void
) {
  "use no memo";
  return useMemo<ColumnDef<IIndicatorItem>[]>(
    () => [
      {
        accessorKey: "parameterName",
        header: "指标名称",
        cell: ({ row }) => <div className="font-medium">{row.original.parameterName}</div>
      },
      {
        accessorKey: "engineerLevelName",
        header: "业务层级",
        cell: ({ row }) => <div className="font-medium">{row.original.engineerLevelName}</div>
      },
      {
        accessorKey: "parameterClassifyName",
        header: "指标分类",
        cell: ({ row }) => <div className="font-medium">{row.original.parameterClassifyName}</div>
      },
      {
        accessorKey: "intermediateResult",
        header: "中间结果",
        cell: ({ row }) => (
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              row.original.intermediateResult === 1 ? "bg-primary/10 text-primary" : "bg-muted text-foreground"
            }`}
          >
            {row.original.intermediateResult === 1 ? "是" : "否"}
          </span>
        )
      },
      {
        accessorKey: "enableStatus",
        header: "启用状态",
        cell: ({ row }) => (
          <span className={`px-2 py-1 rounded-full text-xs ${IndicatorStatus.getClassName(row.original.enableStatus)}`}>
            {IndicatorStatus.getLabel(row.original.enableStatus)}
          </span>
        )
      },
      {
        id: "actions",
        header: "操作",
        meta: { width: 100 },
        cell: ({ row }) => {
          const indicator = row.original;
          return (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onMouseEnter={onPrefetchFormConfig}
                  onFocus={onPrefetchFormConfig}
                >
                  <span className="sr-only">打开菜单</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>操作</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit(indicator)}>
                  <Edit className="mr-2 h-4 w-4" />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleStatus(indicator)}>
                  <Power className="mr-2 h-4 w-4" />
                  {IndicatorStatus.isEnabled(indicator.enableStatus) ? "停用" : "启用"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(indicator)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }
      }
    ],
    [onEdit, onDelete, onToggleStatus, onPrefetchFormConfig]
  );
}
