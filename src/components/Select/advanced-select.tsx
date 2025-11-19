"use client";

import type { UISelectOption } from "@/types/select";
import { Check, ChevronDown, Search, X } from "lucide-react";
import * as React from "react";
import { highlightText } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// 选择器配置接口
export interface SelectConfig {
  // 基础配置
  mode: "single" | "multiple";
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;

  // 搜索配置
  searchable?: boolean;
  searchPlaceholder?: string;
  searchDelay?: number;

  // 显示配置
  maxDisplayItems?: number;
  showSelectAll?: boolean;
  showItemCount?: boolean;

  // 性能配置
  virtualScrolling?: boolean;
  itemHeight?: number;
  maxHeight?: number;

  // 样式配置
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";

  // 交互配置
  closeOnSelect?: boolean;
  allowDeselect?: boolean;

  // 无障碍配置
  ariaLabel?: string;
  ariaDescription?: string;
}

// 选项数据接口
// 选项数据接口（统一使用公共类型）
// 原本本地定义的 SelectOption 已迁移到 '@/types/select' 中的 UISelectOption

// 组件属性接口
export interface AdvancedSelectProps {
  // 数据
  options: UISelectOption[];
  value?: string | number | (string | number)[];
  onValueChange?: (value: string | number | (string | number)[]) => void;

  // 配置
  config?: Partial<SelectConfig>;

  // 样式
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;

  // 事件
  onSearch?: (searchTerm: string) => void;
  onOpen?: () => void;
  onClose?: () => void;

  // 自定义渲染
  renderOption?: (option: UISelectOption, isSelected: boolean) => React.ReactNode;
  renderValue?: (value: string | number | (string | number)[], options: UISelectOption[]) => React.ReactNode;

  // 无障碍（供 FormControl Slot 传入）
  id?: string;
  ariaLabelledby?: string; // 注意：以 camelCase 命名以避免与 JSX 属性冲突
  ariaDescribedby?: string;
  // 兼容 FormControl Slot 直接传入的标准 ARIA 属性（React 支持使用字符串字面量作为键名）
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

// 默认配置
const defaultConfig: SelectConfig = {
  mode: "single",
  placeholder: "请选择...",
  disabled: false,
  clearable: true,
  searchable: true,
  searchPlaceholder: "搜索选项...",
  searchDelay: 300,
  maxDisplayItems: 2,
  showSelectAll: true,
  showItemCount: true,
  virtualScrolling: false,
  itemHeight: 36,
  maxHeight: 300,
  size: "default",
  variant: "default",
  closeOnSelect: true,
  allowDeselect: true
};

// 搜索工具函数
function searchOptions(options: UISelectOption[], searchTerm: string): UISelectOption[] {
  if (!searchTerm.trim()) return options;

  const term = searchTerm.toLowerCase();
  return options.filter((option) => {
    const labelMatch = option.label.toLowerCase().includes(term);
    const valueMatch = String(option.value).toLowerCase().includes(term);
    const keywordsMatch = option.searchKeywords?.some((keyword) => keyword.toLowerCase().includes(term));
    const descriptionMatch = option.description?.toLowerCase().includes(term);

    return labelMatch || valueMatch || keywordsMatch || descriptionMatch;
  });
}

// 文本高亮已抽离至公共方法 '@/components/common/highlightText'

// 防抖Hook
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 虚拟滚动Hook
function useVirtualScrolling(items: UISelectOption[], itemHeight: number, containerHeight: number, enabled: boolean) {
  const [scrollTop, setScrollTop] = React.useState(0);

  if (!enabled) {
    return {
      visibleItems: items,
      totalHeight: items.length * itemHeight,
      offsetY: 0,
      onScroll: () => {}
    };
  }

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, items.length);

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;
  const totalHeight = items.length * itemHeight;

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll
  };
}

// 主组件
export function AdvancedSelect(props: AdvancedSelectProps) {
  const {
    options,
    value,
    onValueChange,
    config: userConfig = {},
    className: _className,
    triggerClassName,
    contentClassName,
    onSearch,
    onOpen,
    onClose,
    renderOption,
    renderValue,
    id,
    ariaLabelledby,
    ariaDescribedby
  } = props;
  // 兼容 FormControl Slot 直接注入的标准 ARIA 属性
  const ariaLabelledbyFromSlot = (props as any)["aria-labelledby"] as string | undefined;
  const ariaDescribedbyFromSlot = (props as any)["aria-describedby"] as string | undefined;
  const ariaLabelledbyFinal = ariaLabelledby ?? ariaLabelledbyFromSlot;
  const ariaDescribedbyFinal = ariaDescribedby ?? ariaDescribedbyFromSlot;
  const config = React.useMemo(() => ({ ...defaultConfig, ...userConfig }), [userConfig]);

  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, config.searchDelay!);
  // 为弹层内的搜索框提供唯一的 id/name，避免浏览器发出“未提供 id/name”的警告，并利于自动填充/记忆
  const searchInputId = React.useId();
  // 为弹层容器提供 id，触发器使用 aria-controls 进行关联
  const contentId = React.useId();

  // 处理选中值
  const selectedValues = React.useMemo(() => {
    if (config.mode === "single") {
      return value ? [value as string | number] : [];
    }
    return (value as (string | number)[]) || [];
  }, [value, config.mode]);

  // 过滤选项
  const filteredOptions = React.useMemo(() => {
    const filtered = searchOptions(options, debouncedSearchTerm);
    return filtered;
  }, [options, debouncedSearchTerm]);

  // 虚拟滚动
  const { visibleItems, totalHeight, offsetY, onScroll } = useVirtualScrolling(
    filteredOptions,
    config.itemHeight!,
    config.maxHeight!,
    config.virtualScrolling!
  );

  // 全量可选项（不受搜索过滤影响，用于计算全选的勾选态）
  const enabledAllOptions = React.useMemo(() => options.filter((opt) => !opt.disabled), [options]);
  const isAllSelectedGlobal = React.useMemo(
    () => enabledAllOptions.length > 0 && enabledAllOptions.every((opt) => selectedValues.includes(opt.value)),
    [enabledAllOptions, selectedValues]
  );

  // 搜索回调
  React.useEffect(() => {
    if (onSearch && debouncedSearchTerm !== searchTerm) {
      onSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, onSearch, searchTerm]);

  // 处理选择
  const handleSelect = (optionValue: string | number) => {
    if (config.mode === "single") {
      const newValue = selectedValues.includes(optionValue) && config.allowDeselect ? "" : optionValue;
      onValueChange?.(newValue);

      if (config.closeOnSelect) {
        setOpen(false);
      }
    } else {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];
      onValueChange?.(newValues);
    }
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (config.mode !== "multiple") return;

    const allValues = filteredOptions.filter((opt) => !opt.disabled).map((opt) => opt.value);
    const isAllSelected = allValues.every((val) => selectedValues.includes(val));

    const newValues = isAllSelected ? [] : allValues;
    onValueChange?.(newValues);
  };

  // 清空选择
  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onValueChange?.(config.mode === "single" ? "" : []);
  };

  // 处理打开/关闭
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      onOpen?.();
    } else {
      onClose?.();
      setSearchTerm("");
    }
  };

  // 渲染触发器内容
  const renderTriggerContent = () => {
    if (renderValue) {
      return renderValue(value || (config.mode === "single" ? "" : []), options);
    }

    if (selectedValues.length === 0) {
      return <span className="text-muted-foreground">{config.placeholder}</span>;
    }

    if (config.mode === "single") {
      const option = options.find((opt) => opt.value === selectedValues[0]);
      return <span>{option?.label || selectedValues[0]}</span>;
    }

    // 多选模式显示
    if (selectedValues.length <= config.maxDisplayItems!) {
      return (
        <div className="flex flex-wrap gap-1">
          {selectedValues.map((val) => {
            const option = options.find((opt) => opt.value === val);
            return (
              <Badge
                key={String(val)}
                variant="secondary"
                className="text-xs px-2 py-0.5 max-w-32 flex items-center gap-1"
              >
                <span className="truncate">{option?.label || String(val)}</span>
                <div
                  role="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect(val);
                  }}
                  className="flex items-center justify-center rounded-sm p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors cursor-pointer"
                  aria-label="移除选项"
                >
                  <X className="h-3 w-3" />
                </div>
              </Badge>
            );
          })}
        </div>
      );
    }

    // 显示数量
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          已选择 {selectedValues.length} 项
        </Badge>
        {config.showItemCount && <span className="text-sm text-muted-foreground">/ {options.length}</span>}
      </div>
    );
  };

  // 渲染选项
  const renderOptionItem = (option: UISelectOption, index: number) => {
    const isSelected = selectedValues.includes(option.value);
    // 使用 value 和 index 组合确保 key 唯一性，处理空值情况
    const uniqueKey =
      option.value !== "" && option.value !== null && option.value !== undefined
        ? String(option.value)
        : `option-${index}`;

    if (renderOption) {
      return <div key={uniqueKey}>{renderOption(option, isSelected)}</div>;
    }

    return (
      <div
        key={uniqueKey}
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors rounded-sm",
          "hover:bg-accent hover:text-accent-foreground",
          "focus:bg-accent focus:text-accent-foreground focus:outline-none",
          isSelected && "bg-primary/10 text-primary",
          option.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
        )}
        onClick={() => !option.disabled && handleSelect(option.value)}
        role="option"
        aria-selected={isSelected}
        aria-disabled={option.disabled}
      >
        {config.mode === "multiple" && (
          <Checkbox
            checked={isSelected}
            disabled={option.disabled}
            className="h-4 w-4"
            onClick={(e) => e.stopPropagation()}
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="truncate">{highlightText(option.label, searchTerm)}</div>
          {option.description && (
            <div className="text-xs text-muted-foreground truncate">
              {highlightText(option.description ?? "", searchTerm)}
            </div>
          )}
        </div>

        {config.mode === "single" && isSelected && <Check className="h-4 w-4 text-primary" />}
      </div>
    );
  };

  const sizeClasses = {
    sm: "h-8 text-xs",
    default: "h-9 text-sm",
    lg: "h-10 text-base"
  };

  const hasSelection = selectedValues.length > 0;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={config.ariaLabel}
          aria-labelledby={ariaLabelledbyFinal}
          aria-describedby={[config.ariaDescription, ariaDescribedbyFinal].filter(Boolean).join(" ") || undefined}
          aria-controls={contentId}
          aria-haspopup="listbox"
          disabled={config.disabled}
          className={cn(
            "w-full justify-between text-left font-normal",
            sizeClasses[config.size!],
            "hover:bg-accent/50 hover:text-accent-foreground",
            "focus-visible:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-0",
            !hasSelection && "text-muted-foreground",
            config.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent",
            _className,
            triggerClassName
          )}
        >
          <div className="flex-1 min-w-0 overflow-hidden">{renderTriggerContent()}</div>

          <div className="flex items-center ml-2 gap-1 shrink-0">
            {config.clearable && hasSelection && !config.disabled ? (
              <div
                role="button"
                onClick={handleClear}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    handleClear(e as any);
                  }
                }}
                className="flex items-center justify-center rounded-sm p-1 hover:bg-muted transition-colors cursor-pointer"
                aria-label="清空选择"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </div>
            ) : (
              <ChevronDown
                className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")}
              />
            )}
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        id={contentId}
        className={cn("w-full p-0 shadow-lg border bg-popover text-popover-foreground", contentClassName)}
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  id={searchInputId}
                  name={id ? `${id}-search` : "advanced-select-search"}
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

          {/* 全选按钮 */}
          {config.mode === "multiple" && config.showSelectAll && filteredOptions.length > 0 && (
            <div className="px-1 py-2 border-b">
              <div
                role="checkbox"
                aria-checked={isAllSelectedGlobal}
                aria-label="全选"
                tabIndex={0}
                onClick={handleSelectAll}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelectAll();
                  }
                }}
                className="w-full flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors"
              >
                <Checkbox checked={isAllSelectedGlobal} className="h-4 w-4" />
                全选
              </div>
            </div>
          )}

          {/* 选项列表 */}
          <div
            className="flex-1 overflow-auto"
            style={{ maxHeight: config.maxHeight }}
            onScroll={onScroll}
            role="listbox"
            aria-multiselectable={config.mode === "multiple"}
          >
            {filteredOptions.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <div className="mb-2 text-lg opacity-50">🔍</div>
                <div className="font-medium">{searchTerm ? "未找到匹配项" : "暂无选项"}</div>
                {searchTerm && <div className="text-xs mt-1 opacity-75">尝试调整搜索关键词</div>}
              </div>
            ) : (
              <div className="relative" style={{ height: config.virtualScrolling ? totalHeight : "auto" }}>
                <div
                  className="p-1"
                  style={{
                    transform: config.virtualScrolling ? `translateY(${offsetY}px)` : undefined
                  }}
                >
                  {(config.virtualScrolling ? visibleItems : filteredOptions).map((option, index) =>
                    renderOptionItem(option, index)
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 状态栏 */}
          {config.showItemCount && (
            <div className="px-3 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
              {config.mode === "multiple" && selectedValues.length > 0 && (
                <span>已选择 {selectedValues.length} 项 • </span>
              )}
              共 {filteredOptions.length} 项{searchTerm && ` (搜索: "${searchTerm}")`}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// 预设配置
export const selectPresets = {
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
    showSelectAll: true,
    closeOnSelect: false
  },

  // 大数据量多选
  largeData: {
    mode: "multiple" as const,
    searchable: true,
    virtualScrolling: true,
    showSelectAll: true,
    closeOnSelect: false,
    maxHeight: 400
  },

  // 紧凑模式
  compact: {
    size: "sm" as const,
    maxDisplayItems: 1,
    showItemCount: true
  }
} as const;

export type SelectPreset = keyof typeof selectPresets;
