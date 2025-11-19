"use client";

import type { CascadingOption } from "@/types/select";
import { Check, ChevronDown, Search, X } from "lucide-react";
import * as React from "react";
import { highlightText } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// 选项类型统一至公共类型 '@/types/select'

export interface CascadingSelectConfig {
  placeholder?: string;
  parentPlaceholder?: string;
  childPlaceholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  showItemCount?: boolean;
  showSelectAll?: boolean;
  size?: "sm" | "default" | "lg";
}

export interface CascadingSelectProps {
  options: CascadingOption[];
  parentValue?: string | number;
  childValue?: string | number | (string | number)[];
  onParentChange?: (value: string | number) => void;
  onChildChange?: (value: string | number | (string | number)[]) => void;
  config?: Partial<CascadingSelectConfig>;
  className?: string;
  // 无障碍（供 FormControl Slot 传入）
  id?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
}

const defaultConfig: CascadingSelectConfig = {
  placeholder: "请选择",
  parentPlaceholder: "请选择",
  childPlaceholder: "请选择",
  disabled: false,
  clearable: true,
  searchable: true,
  searchPlaceholder: "搜索选项...",
  showItemCount: true,
  showSelectAll: true,
  size: "default"
};

// 搜索工具函数
function searchOptions(options: CascadingOption[], searchTerm: string): CascadingOption[] {
  if (!searchTerm.trim()) return options;

  const term = searchTerm.toLowerCase();
  return options.filter((option) => {
    const labelMatch = option.label?.toLowerCase().includes(term);
    const valueMatch = String(option.value).toLowerCase().includes(term);
    return labelMatch || valueMatch;
  });
}

// 文本高亮已抽离至公共方法 '@/components/common/highlightText'

export function CascadingSelect(props: CascadingSelectProps) {
  const {
    options,
    parentValue,
    childValue,
    onParentChange,
    onChildChange,
    config: userConfig = {},
    className,
    id,
    ariaLabelledby,
    ariaDescribedby
  } = props;

  const config = React.useMemo(() => ({ ...defaultConfig, ...userConfig }), [userConfig]);

  const [parentOpen, setParentOpen] = React.useState(false);
  const [childOpen, setChildOpen] = React.useState(false);
  const [parentSearchTerm, setParentSearchTerm] = React.useState("");
  // 为父级弹层搜索框提供唯一的 id/name
  const parentSearchInputId = React.useId();
  const [childSearchTerm, setChildSearchTerm] = React.useState("");
  // 为子级弹层搜索框提供唯一的 id/name
  const childSearchInputId = React.useId();

  // 兼容 FormControl 插槽传入的标准 ARIA 属性，并映射到内部使用的 camelCase 变量
  const ariaLabelledbyFromSlot = (props as any)["aria-labelledby"] as string | undefined;
  const ariaDescribedbyFromSlot = (props as any)["aria-describedby"] as string | undefined;
  const ariaLabelledbyFinal = ariaLabelledby ?? ariaLabelledbyFromSlot;
  const ariaDescribedbyFinal = ariaDescribedby ?? ariaDescribedbyFromSlot;

  // 为弹层内容提供稳定的 id，以便触发器可以通过 aria-controls 进行关联
  const parentContentId = React.useId();
  const childContentId = React.useId();

  const selectedParent = React.useMemo(() => {
    if (!parentValue || parentValue === "") return undefined;
    return options.find((opt) => {
      if (!opt.value) return false;
      return String(opt.value) === String(parentValue);
    });
  }, [options, parentValue]);

  const childOptions = React.useMemo(() => {
    return selectedParent?.children || [];
  }, [selectedParent]);

  // 处理子级选中值（支持多选）
  const selectedChildValues = React.useMemo(() => {
    if (!childValue) return [];
    if (Array.isArray(childValue)) return childValue;
    if (childValue === "") return [];
    return [childValue];
  }, [childValue]);

  const selectedChildLabels = React.useMemo(() => {
    return selectedChildValues
      .map((val) => {
        const option = childOptions.find((opt) => String(opt.value) === String(val));
        return option?.label;
      })
      .filter(Boolean);
  }, [selectedChildValues, childOptions]);

  // 过滤父级选项
  const filteredParentOptions = React.useMemo(() => {
    return searchOptions(options, parentSearchTerm);
  }, [options, parentSearchTerm]);

  // 过滤子级选项
  const filteredChildOptions = React.useMemo(() => {
    return searchOptions(childOptions, childSearchTerm);
  }, [childOptions, childSearchTerm]);

  const childEnabledFilteredOptions = React.useMemo(() => {
    return filteredChildOptions.filter((opt) => !opt.disabled);
  }, [filteredChildOptions]);

  const isAllSelectedChild = React.useMemo(() => {
    if (childEnabledFilteredOptions.length === 0) return false;
    return childEnabledFilteredOptions.every((opt) => selectedChildValues.some((v) => String(v) === String(opt.value)));
  }, [childEnabledFilteredOptions, selectedChildValues]);

  const handleSelectAllChild = () => {
    const allValues = childEnabledFilteredOptions.map((opt) => opt.value);
    const next = isAllSelectedChild ? [] : allValues;
    onChildChange?.(next);
  };

  const handleParentSelect = (value: string | number) => {
    onParentChange?.(value);
    onChildChange?.([]);
    setParentOpen(false);
    setParentSearchTerm("");
  };

  const handleChildSelect = (value: string | number) => {
    const newValues = selectedChildValues.includes(value)
      ? selectedChildValues.filter((v) => String(v) !== String(value))
      : [...selectedChildValues, value];
    onChildChange?.(newValues);
  };

  // 清空父级（同时清空子级）
  const handleClearParent = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onParentChange?.("");
    onChildChange?.([]);
  };

  // 只清空子级
  const handleClearChild = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChildChange?.([]);
  };

  const handleParentOpenChange = (open: boolean) => {
    setParentOpen(open);
    if (!open) {
      setParentSearchTerm("");
    }
  };

  const handleChildOpenChange = (open: boolean) => {
    setChildOpen(open);
    if (!open) {
      setChildSearchTerm("");
    }
  };

  const sizeClasses = {
    sm: "h-8 text-xs",
    default: "h-9 text-sm",
    lg: "h-10 text-base"
  };

  const hasParentSelection = !!parentValue;
  const hasChildSelection = selectedChildValues.length > 0;

  return (
    <div
      className={cn(
        "relative flex items-center border rounded-md bg-background",
        sizeClasses[config.size!],
        config.disabled && "opacity-50 cursor-not-allowed bg-muted",
        className
      )}
    >
      {/* 父级下拉框 */}
      <div className="relative flex-1 flex items-center">
        <Popover open={parentOpen} onOpenChange={handleParentOpenChange}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type="button"
              variant="ghost"
              disabled={config.disabled}
              aria-controls={parentContentId}
              aria-expanded={parentOpen}
              aria-haspopup="listbox"
              aria-labelledby={ariaLabelledbyFinal}
              aria-describedby={ariaDescribedbyFinal}
              className={cn(
                "w-full flex items-center justify-between px-3 text-left h-full rounded-l-md rounded-r-none border-0",
                "hover:bg-accent/50 transition-colors font-normal",
                "focus-visible:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-0",
                !selectedParent && "text-muted-foreground",
                config.disabled && "cursor-not-allowed hover:bg-transparent"
              )}
            >
              <span className="truncate text-sm flex-1 mr-1">{selectedParent?.label || config.parentPlaceholder}</span>
              <div className="flex items-center gap-1 shrink-0">
                {config.clearable && hasParentSelection && !config.disabled ? (
                  <div
                    role="button"
                    onClick={handleClearParent}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        onParentChange?.("");
                        onChildChange?.([]);
                      }
                    }}
                    className="flex items-center justify-center rounded-sm p-1 hover:bg-muted transition-colors cursor-pointer"
                    aria-label="清空父级选择"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </div>
                ) : (
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-200",
                      parentOpen && "rotate-180"
                    )}
                  />
                )}
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            id={parentContentId}
            className="w-[240px] p-0 shadow-lg border bg-popover"
            align="start"
            sideOffset={4}
          >
            <div className="flex flex-col overflow-hidden">
              {/* 搜索框 */}
              {config.searchable && (
                <div className="p-2.5 border-b bg-muted/50">
                  <div className="relative flex items-center">
                    <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder={config.searchPlaceholder}
                      value={parentSearchTerm}
                      onChange={(e) => setParentSearchTerm(e.target.value)}
                      id={parentSearchInputId}
                      name={id ? `${id}-parent-search` : "cascading-select-parent-search"}
                      autoComplete="off"
                      className="h-9 pl-9 pr-9 text-sm border-border bg-card focus-visible:outline-none focus-visible:ring-[1px] focus-visible:ring-ring/50 focus-visible:border-ring"
                    />
                    {parentSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setParentSearchTerm("")}
                        className="absolute right-2.5 p-1 rounded hover:bg-muted transition-colors"
                      >
                        <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 选项列表 */}
              <div className="max-h-[300px] overflow-y-auto p-1" role="listbox">
                {filteredParentOptions.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    <div className="mb-2 text-lg opacity-50">🔍</div>
                    <div className="font-medium">{parentSearchTerm ? "未找到匹配项" : "暂无选项"}</div>
                    {parentSearchTerm && <div className="text-xs mt-1 opacity-75">尝试调整搜索关键词</div>}
                  </div>
                ) : (
                  filteredParentOptions.map((option, index) => {
                    const isSelected = parentValue && option.value && String(option.value) === String(parentValue);
                    return (
                      <div
                        key={
                          option.value !== undefined && option.value !== null ? String(option.value) : `parent-${index}`
                        }
                        className={cn(
                          "flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors rounded-sm",
                          "hover:bg-accent hover:text-accent-foreground",
                          "focus:bg-accent focus:text-accent-foreground focus:outline-none",
                          isSelected && "bg-primary/10 text-primary font-medium",
                          option.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
                        )}
                        onClick={() => {
                          if (!option.disabled && option.value !== undefined) {
                            handleParentSelect(option.value);
                          }
                        }}
                        role="option"
                        aria-selected={!!isSelected}
                        aria-disabled={!!option.disabled}
                      >
                        <span className="truncate">{highlightText(option.label ?? "", parentSearchTerm)}</span>
                        {isSelected && <Check className="h-4 w-4 shrink-0 ml-2 text-primary" />}
                      </div>
                    );
                  })
                )}
              </div>

              {/* 状态栏 */}
              {config.showItemCount && (
                <div className="px-3 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
                  共 {filteredParentOptions.length} 项{parentSearchTerm && ` (搜索: "${parentSearchTerm}")`}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* 竖线分割 */}
      <div className="w-px h-full bg-border shrink-0" />

      {/* 子级下拉框 */}
      <div className="relative flex-1 flex items-center">
        <Popover open={childOpen} onOpenChange={handleChildOpenChange}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              disabled={config.disabled || !selectedParent}
              aria-controls={childContentId}
              aria-expanded={childOpen}
              aria-haspopup="listbox"
              aria-labelledby={ariaLabelledbyFinal}
              aria-describedby={ariaDescribedbyFinal}
              className={cn(
                "w-full flex items-center justify-between px-3 text-left h-full rounded-r-md rounded-l-none border-0",
                "hover:bg-accent/50 transition-colors font-normal",
                "focus-visible:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-0",
                selectedChildLabels.length === 0 && "text-muted-foreground",
                (config.disabled || !selectedParent) && "cursor-not-allowed hover:bg-transparent opacity-50"
              )}
            >
              <span className="truncate text-sm flex-1 mr-1">
                {selectedChildLabels.length > 0 ? (
                  selectedChildLabels.length === 1 ? (
                    selectedChildLabels[0]
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        已选择 {selectedChildLabels.length} 项
                      </Badge>
                      <span className="text-sm text-muted-foreground">/ {childOptions.length}</span>
                    </div>
                  )
                ) : (
                  config.childPlaceholder
                )}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {config.clearable && hasChildSelection && !config.disabled && selectedParent ? (
                  <div
                    role="button"
                    onClick={handleClearChild}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        onChildChange?.([]);
                      }
                    }}
                    className="flex items-center justify-center rounded-sm p-1 hover:bg-muted transition-colors cursor-pointer"
                    aria-label="清空子级选择"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </div>
                ) : (
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-200",
                      childOpen && "rotate-180"
                    )}
                  />
                )}
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            id={childContentId}
            className="w-[240px] p-0 shadow-lg border bg-popover"
            align="start"
            sideOffset={4}
          >
            <div className="flex flex-col overflow-hidden">
              {/* 搜索框 */}
              {config.searchable && childOptions.length > 0 && (
                <div className="p-2.5 border-b bg-muted/50">
                  <div className="relative flex items-center">
                    <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder={config.searchPlaceholder}
                      value={childSearchTerm}
                      onChange={(e) => setChildSearchTerm(e.target.value)}
                      id={childSearchInputId}
                      name={id ? `${id}-child-search` : "cascading-select-child-search"}
                      autoComplete="off"
                      className="h-9 pl-9 pr-9 text-sm border-border bg-card focus-visible:outline-none focus-visible:ring-[1px] focus-visible:ring-ring/50 focus-visible:border-ring"
                    />
                    {childSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setChildSearchTerm("")}
                        className="absolute right-2.5 p-1 rounded hover:bg-muted transition-colors"
                      >
                        <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 全选按钮（子级） */}
              {config.showSelectAll && childEnabledFilteredOptions.length > 0 && (
                <div className="px-1 py-2 border-b">
                  <div
                    role="checkbox"
                    aria-checked={isAllSelectedChild}
                    aria-label="全选"
                    tabIndex={0}
                    onClick={handleSelectAllChild}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectAllChild();
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors"
                  >
                    <Checkbox checked={isAllSelectedChild} className="h-4 w-4" />
                    全选
                  </div>
                </div>
              )}

              {/* 选项列表 */}
              <div className="max-h-[300px] overflow-y-auto p-1" role="listbox" aria-multiselectable={true}>
                {childOptions.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    <div className="mb-2 text-lg opacity-50">📂</div>
                    <div className="font-medium">暂无子级选项</div>
                    <div className="text-xs mt-1 opacity-75">请先选择父级选项</div>
                  </div>
                ) : filteredChildOptions.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    <div className="mb-2 text-lg opacity-50">🔍</div>
                    <div className="font-medium">未找到匹配项</div>
                    <div className="text-xs mt-1 opacity-75">尝试调整搜索关键词</div>
                  </div>
                ) : (
                  filteredChildOptions.map((option, index) => {
                    const isSelected =
                      option.value !== undefined && selectedChildValues.some((v) => String(v) === String(option.value));
                    return (
                      <div
                        key={
                          option.value !== undefined && option.value !== null ? String(option.value) : `child-${index}`
                        }
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors rounded-sm",
                          "hover:bg-accent hover:text-accent-foreground",
                          "focus:bg-accent focus:text-accent-foreground focus:outline-none",
                          isSelected && "bg-primary/10 text-primary",
                          option.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
                        )}
                        onClick={() => {
                          if (!option.disabled && option.value !== undefined) {
                            handleChildSelect(option.value);
                          }
                        }}
                        role="option"
                        aria-selected={!!isSelected}
                        aria-disabled={!!option.disabled}
                      >
                        <Checkbox
                          checked={isSelected}
                          disabled={option.disabled}
                          className="h-4 w-4"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="flex-1 truncate">{highlightText(option.label ?? "", childSearchTerm)}</span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* 状态栏 */}
              {config.showItemCount && childOptions.length > 0 && (
                <div className="px-3 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
                  {selectedChildValues.length > 0 && <span>已选择 {selectedChildValues.length} 项 • </span>}共{" "}
                  {filteredChildOptions.length} 项{childSearchTerm && ` (搜索: "${childSearchTerm}")`}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
