import type { UseFormReturn } from "react-hook-form";
import type { SearchFormValues } from "../hooks/useList";
import type { UISelectOption } from "@/types/select";
import { Search } from "lucide-react";
import { SelectField } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

interface SearchBarProps {
  searchForm: UseFormReturn<SearchFormValues>;
  projectTypeOptions: UISelectOption[];
  designStageOptions: UISelectOption[];
  onSearchSubmit: (values: SearchFormValues) => void;
  onAdd: () => void;
  prefetchHandlers: {
    onMouseEnter?: () => void;
    onFocus?: () => void;
  };
}

/**
 * 搜索栏 - 纯渲染组件
 */
export function SearchBar({
  searchForm,
  projectTypeOptions,
  designStageOptions,
  onSearchSubmit,
  onAdd,
  prefetchHandlers
}: SearchBarProps) {
  return (
    <div className="bg-background border-b border-border p-4">
      <Form {...searchForm}>
        <form onSubmit={searchForm.handleSubmit(onSearchSubmit)} className="flex items-center gap-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <SelectField
                control={searchForm.control}
                name="projectTypeId"
                label="所属项目类别"
                options={projectTypeOptions}
                placeholder="请选择类别"
                horizontal
                className="w-48"
              />

              <SelectField
                control={searchForm.control}
                name="designPhaseId"
                label="设计阶段"
                options={designStageOptions}
                placeholder="请选择设计阶段"
                horizontal
                className="w-48"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button type="submit">
                <Search className="h-4 w-4" />
                查询
              </Button>
              <Button type="button" onClick={onAdd} {...prefetchHandlers}>
                新建
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
