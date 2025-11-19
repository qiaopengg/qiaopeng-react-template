import type { TreeNode } from "./Select-tree";
import { ChevronDown, Search, X } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { SelectTree } from "./Select-tree";

// 树形选择器配置接口
export interface TreeSelectConfig {
  // 基础配置
  mode: "single" | "multiple";
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;

  // 搜索配置
  searchable?: boolean;
  searchPlaceholder?: string;

  // 显示配置
  showItemCount?: boolean;
  maxHeight?: number;

  // 样式配置
  size?: "sm" | "default" | "lg";

  // 无障碍配置
  ariaLabel?: string;
  ariaDescription?: string;
}

// 默认配置
const defaultTreeSelectConfig: TreeSelectConfig = {
  mode: "single",
  placeholder: "请选择...",
  disabled: false,
  clearable: true,
  searchable: true,
  searchPlaceholder: "搜索...",
  showItemCount: true,
  maxHeight: 320,
  size: "default"
};

// 工具函数：递归统计树节点总数
function countAllNodes(nodes: TreeNode[]): number {
  let count = 0;

  function traverse(nodeList: TreeNode[]) {
    for (const node of nodeList) {
      count++;
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  }

  traverse(nodes);
  return count;
}

// 工具函数：检查节点是否匹配搜索条件
function matchesSearch(node: TreeNode, searchTerm: string): boolean {
  if (!searchTerm) {
    return true;
  }

  const term = searchTerm.toLowerCase();
  if (node.label.toLowerCase().includes(term)) {
    return true;
  }

  // 递归检查子节点
  if (node.children) {
    return node.children.some((child) => matchesSearch(child, searchTerm));
  }

  return false;
}

// 工具函数：统计匹配搜索条件的节点数
function countMatchingNodes(nodes: TreeNode[], searchTerm: string): number {
  if (!searchTerm) {
    return countAllNodes(nodes);
  }

  let count = 0;

  function traverse(nodeList: TreeNode[]) {
    for (const node of nodeList) {
      if (matchesSearch(node, searchTerm)) {
        count++;
      }
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  }

  traverse(nodes);
  return count;
}

export interface TreeSelectDropdownProps {
  // 数据
  data: TreeNode[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;

  // 配置
  config?: Partial<TreeSelectConfig>;

  // 样式
  className?: string;

  // 事件
  onClear?: () => void;

  // 无障碍（供 FormControl Slot 传入）
  id?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  // 兼容 FormControl Slot 直接传入的标准 ARIA 属性
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

function TreeSelectDropdown(props: TreeSelectDropdownProps) {
  // 为了兼容 FormControl Slot 注入的标准 ARIA 属性，采用和 AdvancedSelect/CascadingSelect 一致的 props 读取方式
  const {
    data,
    value,
    onValueChange,
    config: userConfig = {},
    className,
    onClear,
    id,
    ariaLabelledby,
    ariaDescribedby
  } = props;
  // 兼容 FormControl Slot 注入的标准 ARIA 属性（通过 props 读取，而不是使用 arguments[0]）
  const ariaLabelledbyFromSlot = (props as any)["aria-labelledby"] as string | undefined;
  const ariaDescribedbyFromSlot = (props as any)["aria-describedby"] as string | undefined;
  const ariaLabelledbyFinal = ariaLabelledby ?? ariaLabelledbyFromSlot;
  const ariaDescribedbyFinal = ariaDescribedby ?? ariaDescribedbyFromSlot;
  // 合并配置，仅使用默认配置与传入的 config
  const finalConfig = React.useMemo(() => {
    const mergedConfig = { ...defaultTreeSelectConfig, ...userConfig };
    return mergedConfig;
  }, [userConfig]);

  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  // 为弹层内的搜索框提供唯一的 id/name，避免浏览器发出“未提供 id/name”的警告，并利于自动填充/记忆
  const searchInputId = React.useId();
  // 为弹层内容提供稳定的 id，以便触发器通过 aria-controls 进行关联
  const contentId = React.useId();
  const [selectedValues, setSelectedValues] = React.useState<Set<string>>(
    new Set(Array.isArray(value) ? value : value ? [value] : [])
  );

  // 跟踪选中项的顺序，最后选中的在前面
  const [selectionOrder, setSelectionOrder] = React.useState<string[]>([]);

  // 计算节点统计信息
  const nodeStats = React.useMemo(() => {
    const totalNodes = countAllNodes(data);
    const matchingNodes = countMatchingNodes(data, searchTerm);
    return { totalNodes, matchingNodes };
  }, [data, searchTerm]);

  // 同步外部 value 变化
  React.useEffect(() => {
    const newValues = Array.isArray(value) ? value : value ? [value] : [];
    setSelectedValues(new Set(newValues));

    // 同步选择顺序，保持现有选中项的顺序，新增项放在前面
    setSelectionOrder((prevOrder) => {
      const existingInOrder = prevOrder.filter((id) => newValues.includes(id));
      const newItems = newValues.filter((id) => !prevOrder.includes(id));
      return [...newItems, ...existingInOrder];
    });
  }, [value]);

  // 获取所有节点的映射，用于显示选中项的名称
  const nodeMap = React.useMemo(() => {
    const map = new Map<string, TreeNode>();

    function traverse(nodes: TreeNode[]) {
      nodes.forEach((node) => {
        const nodeValue = node.value;
        map.set(nodeValue, node);
        if (node.children) {
          traverse(node.children);
        }
      });
    }

    traverse(data);
    return map;
  }, [data]);

  // 关闭弹窗时重置搜索词条
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchTerm("");
    }
  };

  const handleSelectionChange = (newSelectedValues: Set<string>) => {
    setSelectedValues(newSelectedValues);

    const newValuesArray = Array.from(newSelectedValues);
    const oldValuesArray = Array.from(selectedValues);

    setSelectionOrder((prevOrder) => {
      const newlySelected = newValuesArray.filter((id) => !oldValuesArray.includes(id));
      const existingInOrder = prevOrder.filter((id) => newValuesArray.includes(id));
      return [...newlySelected, ...existingInOrder];
    });

    if (finalConfig.mode === "single") {
      const selectedArray = Array.from(newSelectedValues);
      const newValue = selectedArray.length > 0 ? selectedArray[0] : "";
      onValueChange?.(newValue);
      handleOpenChange(false);
    } else {
      onValueChange?.(Array.from(newSelectedValues));
    }
  };

  // 获取选中项的显示文本
  const getDisplayText = () => {
    if (selectedValues.size === 0) {
      return finalConfig.placeholder;
    }

    if (finalConfig.mode === "single") {
      const selectedId = Array.from(selectedValues)[0];
      const node = nodeMap.get(selectedId);
      return node?.label || selectedId;
    }

    const orderedSelectedIds = selectionOrder.filter((id) => selectedValues.has(id));
    return orderedSelectedIds
      .map((id) => {
        const node = nodeMap.get(id);
        return node?.label || id;
      })
      .join(", ");
  };

  // 清空选择
  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedValues(new Set());
    setSelectionOrder([]);
    onValueChange?.(finalConfig.mode === "single" ? "" : []);
    onClear?.();
  };

  // 样式配置
  const sizeClasses = {
    sm: "h-8 text-xs",
    default: "h-9 text-sm",
    lg: "h-10 text-base"
  };

  const hasSelection = selectedValues.size > 0;

  // 渲染多选标签
  const renderMultiSelectBadges = () => {
    if (finalConfig.mode !== "multiple" || selectedValues.size === 0) {
      return null;
    }

    const orderedSelectedIds = selectionOrder.filter((id) => selectedValues.has(id));

    // 如果选中项超过2个，显示数量统计
    if (selectedValues.size > 2) {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            已选择 {selectedValues.size} 项
          </Badge>
          {finalConfig.showItemCount && <span className="text-sm text-muted-foreground">/ {countAllNodes(data)}</span>}
        </div>
      );
    }

    // 选中项不超过2个时，显示所有选中项
    return (
      <div className="flex items-center gap-1 max-w-full overflow-hidden">
        {orderedSelectedIds.map((id) => {
          const node = nodeMap.get(id);
          const displayName = node?.label || id;

          return (
            <Badge
              key={id}
              variant="secondary"
              className="text-xs px-2 py-0.5 max-w-20 flex items-center gap-1 shrink-0"
            >
              <span className="truncate">{displayName}</span>
              <div
                role="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const newSelectedValues = new Set(selectedValues);
                  newSelectedValues.delete(id);
                  handleSelectionChange(newSelectedValues);
                }}
                className="flex items-center justify-center cursor-pointer hover:bg-destructive/20 hover:text-destructive rounded-sm transition-colors p-0.5"
                aria-label={`移除 ${displayName}`}
              >
                <X className="h-3 w-3" />
              </div>
            </Badge>
          );
        })}
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-controls={contentId}
          aria-haspopup="listbox"
          aria-label={finalConfig.ariaLabel}
          aria-labelledby={ariaLabelledbyFinal}
          aria-describedby={[finalConfig.ariaDescription, ariaDescribedbyFinal].filter(Boolean).join(" ") || undefined}
          disabled={finalConfig.disabled}
          className={cn(
            "w-full justify-between text-left font-normal",
            sizeClasses[finalConfig.size!],
            "hover:bg-accent/50 hover:text-accent-foreground",
            "focus-visible:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-0",
            !hasSelection && "text-muted-foreground",
            finalConfig.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent",
            className
          )}
        >
          <div className="flex-1 min-w-0 overflow-hidden">
            {finalConfig.mode === "multiple" && hasSelection ? (
              renderMultiSelectBadges()
            ) : (
              <span className={cn(!hasSelection && "text-muted-foreground")}>{getDisplayText()}</span>
            )}
          </div>

          <div className="flex items-center ml-2 gap-1 shrink-0">
            {finalConfig.clearable && hasSelection && !finalConfig.disabled ? (
              // 有选中项时显示清空按钮
              <div
                role="button"
                onClick={handleClear}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedValues(new Set());
                    setSelectionOrder([]);
                    onValueChange?.(finalConfig.mode === "single" ? "" : []);
                    onClear?.();
                  }
                }}
                className="flex items-center justify-center rounded-sm p-1 hover:bg-muted transition-colors cursor-pointer"
                aria-label="清空选择"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </div>
            ) : (
              // 没有选中项时显示展开收起按钮
              <ChevronDown
                className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")}
              />
            )}
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        id={contentId}
        className="w-full p-0 shadow-lg border bg-popover text-popover-foreground"
        align="start"
        sideOffset={4}
      >
        <div className="flex flex-col overflow-hidden">
          {/* 搜索框 */}
          {finalConfig.searchable && (
            <div className="p-2.5 border-b bg-muted/50">
              <div className="relative flex items-center">
                <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder={finalConfig.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  id={searchInputId}
                  name={id ? `${id}-search` : "tree-select-search"}
                  autoComplete="off"
                  className="h-9 pl-9 pr-9 text-sm border-border bg-card focus-visible:outline-none focus-visible:ring-[1px] focus-visible:ring-ring/50 focus-visible:border-ring"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 p-1 rounded hover:bg-muted transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 选项列表 */}
          <div
            className="flex-1 overflow-auto"
            style={{ maxHeight: finalConfig.maxHeight }}
            role="tree"
            aria-multiselectable={finalConfig.mode === "multiple"}
          >
            {data.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <div className="mb-2 text-lg opacity-50">📂</div>
                <div className="font-medium">暂无数据</div>
              </div>
            ) : (
              <div className="p-1">
                {data.map((node) => (
                  <SelectTree
                    key={node.value}
                    node={node}
                    selectedValues={selectedValues}
                    onSelectionChange={handleSelectionChange}
                    selectionMode={finalConfig.mode}
                    searchTerm={searchTerm}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 状态栏 */}
          {finalConfig.showItemCount && (
            <div className="px-3 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
              {finalConfig.mode === "multiple" && selectedValues.size > 0 && (
                <span>已选择 {selectedValues.size} 项 • </span>
              )}
              共 {nodeStats.matchingNodes} 项{searchTerm && ` (搜索: "${searchTerm}")`}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// 预设配置
export const treeSelectPresets = {
  // 基础单选
  basic: {
    mode: "single" as const,
    searchable: false,
    clearable: true
  },

  // 搜索单选
  searchable: {
    mode: "single" as const,
    searchable: true,
    clearable: true
  },

  // 基础多选
  multiple: {
    mode: "multiple" as const,
    searchable: true,
    showItemCount: true
  },

  // 紧凑模式
  compact: {
    size: "sm" as const,
    showItemCount: true
  }
} as const;

export type TreeSelectPreset = keyof typeof treeSelectPresets;

export { TreeSelectDropdown };
