import type { Control, FieldValues } from "react-hook-form";
import type { CascadingOption } from "@/types/select";
import { RequiredStar } from "@/components/common";
import { CascadingSelect } from "@/components/Select/cascading-select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface CascadingSelectFieldProps<TFieldValues extends FieldValues = FieldValues> {
  control: Control<TFieldValues>;
  label: string;
  required?: boolean;
  options: CascadingOption[];
  parentName: keyof TFieldValues | string;
  childName: keyof TFieldValues | string;
  parentPlaceholder?: string;
  childPlaceholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * 统一的级联选择封装（父/子两层字段）
 * - 与其他字段组件在视觉与结构上保持一致
 * - 将校验信息绑定到子字段（常见必填为子级）
 */
export function CascadingSelectField<TFieldValues extends FieldValues = FieldValues>({
  control,
  label,
  required,
  options,
  parentName,
  childName,
  parentPlaceholder = "请选择工程类别",
  childPlaceholder = "请选择工程子类",
  disabled,
  className
}: CascadingSelectFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={parentName as any}
      render={({ field: parentField }) => (
        <FormField
          control={control}
          name={childName as any}
          render={({ field: childField }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium" useHtmlFor={false}>
                {label}
                {required && <RequiredStar />}
              </FormLabel>
              <FormControl>
                <CascadingSelect
                  options={options}
                  parentValue={parentField.value}
                  childValue={childField.value}
                  onParentChange={parentField.onChange}
                  onChildChange={childField.onChange}
                  config={{
                    parentPlaceholder,
                    childPlaceholder,
                    clearable: true,
                    size: "default",
                    disabled
                  }}
                  className={className ?? "h-9 w-full"}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    />
  );
}

export default CascadingSelectField;
