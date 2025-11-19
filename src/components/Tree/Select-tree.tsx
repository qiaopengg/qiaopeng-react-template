import type { SelectOption } from "@/types/project-config";
import { Check, ChevronRight, Minus } from "lucide-react";
import * as React from "react";
import { highlightText } from "@/components/common";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// 扩展 SelectOption 接口以支持 disabled 属性
interface TreeNode extends SelectOption {
  disabled?: boolean;
}

// 选择模式类型
type SelectionMode = "single" | "multiple";

// 选择状态类型
type SelectionState = "none" | "partial" | "full";

// 树形选择器属性接口
interface TreeSelectProps {
  node: TreeNode;
  selectedValues?: Set<string>;
  onSelectionChange?: (selectedValues: Set<string>) => void;
  selectionMode?: SelectionMode;
  level?: number;
  searchTerm?: string;
  onNodeClick?: (node: TreeNode) => void;
  className?: string;
}

// 获取节点及其所有子节点的值
function getAllNodeValues(node: TreeNode): string[] {
  const values: string[] = [];

  function traverse(currentNode: TreeNode) {
    const nodeValue = currentNode.value;
    values.push(nodeValue);

    if (currentNode.children) {
      currentNode.children.forEach(traverse);
    }
  }

  traverse(node);
  return values;
}

// 获取节点选择状态
function getNodeSelectionState(node: TreeNode, selectedValues: Set<string>): SelectionState {
  const allValues = getAllNodeValues(node);
  const selectedCount = allValues.filter((value) => selectedValues.has(value)).length;

  if (selectedCount === 0) {
    return "none";
  } else if (selectedCount === allValues.length) {
    return "full";
  } else {
    return "partial";
  }
}

// 文本高亮已抽离至公共方法 '@/components/common/highlightText'

// 检查节点是否匹配搜索条件
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

function SelectTree({
  node,
  selectedValues = new Set(),
  onSelectionChange,
  selectionMode = "single",
  level = 0,
  searchTerm = "",
  onNodeClick,
  className
}: TreeSelectProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const nodeValue = node.value;
  const selectionState = getNodeSelectionState(node, selectedValues);
  const isSelected = selectionState === "full";
  const isPartiallySelected = selectionState === "partial";
  const isDisabled = node.disabled;
  const hasChildren = node.children && node.children.length > 0;

  const handleSelectionChange = () => {
    if (isDisabled || !onSelectionChange) {
      return;
    }

    const newSelectedValues = new Set(selectedValues);

    if (selectionMode === "multiple") {
      if (hasChildren) {
        // 父节点：根据当前状态决定操作
        if (isSelected || isPartiallySelected) {
          // 取消选择：移除当前节点及所有子节点
          const allValues = getAllNodeValues(node);
          allValues.forEach((value) => newSelectedValues.delete(value));
        } else {
          // 选择：添加当前节点及所有子节点
          const allValues = getAllNodeValues(node);
          allValues.forEach((value) => newSelectedValues.add(value));
        }
      } else {
        // 叶子节点：切换选择状态
        if (isSelected) {
          newSelectedValues.delete(nodeValue);
        } else {
          newSelectedValues.add(nodeValue);
        }
      }
    }

    onSelectionChange(newSelectedValues);
    onNodeClick?.(node);
  };

  const handleSingleSelect = () => {
    if (isDisabled || !onSelectionChange) {
      return;
    }

    const newSelectedValues = new Set<string>();
    if (!isSelected) {
      newSelectedValues.add(nodeValue);
    }

    onSelectionChange(newSelectedValues);
    onNodeClick?.(node);
  };

  // 处理展开/收起功能
  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  // 处理节点选择功能
  const handleNodeSelect = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (selectionMode === "multiple") {
      handleSelectionChange();
    } else if (selectionMode === "single") {
      handleSingleSelect();
    }
  };

  // 搜索过滤
  const shouldShow = matchesSearch(node, searchTerm);
  if (!shouldShow) {
    return null;
  }

  // 搜索高亮仅用于文本（通过 highlightText 渲染），不再为整项添加底色以与其它下拉组件保持一致

  return (
    <div className="w-full">
      <div
        className={cn(
          "group flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer transition-all duration-150 rounded-md mx-0.5 my-0.5",
          "hover:bg-accent/50 hover:text-accent-foreground",
          "focus:bg-accent focus:text-accent-foreground focus:outline-none focus:ring-1 focus:ring-ring",
          isSelected && "bg-primary/10 text-primary font-medium",
          isPartiallySelected && "bg-primary/5 text-primary",
          isDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent",
          className
        )}
        onClick={handleNodeSelect}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        tabIndex={0}
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-disabled={isDisabled}
      >
        {/* 展开/收起图标 */}
        {hasChildren ? (
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-transform duration-150 text-muted-foreground cursor-pointer",
              isExpanded && "rotate-90",
              "group-hover:text-foreground"
            )}
            onClick={handleToggleExpand}
          />
        ) : (
          <div className="w-3.5 h-3.5 shrink-0" />
        )}

        {/* 复选框 */}
        {selectionMode === "multiple" && (
          <div className="flex items-center">
            {isPartiallySelected ? (
              <div className="h-4 w-4 rounded-sm border border-primary bg-primary/10 flex items-center justify-center">
                <Minus className="h-3 w-3 text-primary" />
              </div>
            ) : (
              <Checkbox
                checked={isSelected}
                onCheckedChange={handleSelectionChange}
                className="h-4 w-4 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                disabled={isDisabled}
              />
            )}
          </div>
        )}

        {/* 节点标签 */}
        <span className="flex-1 truncate text-sm leading-none">{highlightText(node.label, searchTerm)}</span>

        {/* 子节点数量指示器 */}
        {hasChildren && (
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {node.children?.length}
          </span>
        )}

        {/* 单选模式的选中指示器 */}
        {selectionMode === "single" && isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
      </div>

      {/* 子节点 */}
      {hasChildren && isExpanded && (
        <div className="relative">
          <div className="absolute left-2 top-0 bottom-0 w-px bg-border/40" style={{ left: `${level * 16 + 16}px` }} />
          {node.children?.map((child) => (
            <SelectTree
              key={child.value}
              node={child}
              selectedValues={selectedValues}
              onSelectionChange={onSelectionChange}
              selectionMode={selectionMode}
              level={level + 1}
              searchTerm={searchTerm}
              onNodeClick={onNodeClick}
              className={className}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export { type SelectionMode, SelectTree, type TreeNode, type TreeSelectProps };
