import type { Control, FieldValues } from "react-hook-form";
import React from "react";
import { RequiredStar } from "@/components/common";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface LabeledFieldProps<TFieldValues extends FieldValues = FieldValues> {
  control: Control<TFieldValues>;
  name: keyof TFieldValues | string;
  label: string;
  required?: boolean;
  children: (field: any) => React.ReactNode;
  itemClassName?: string;
  labelClassName?: string;
  /**
   * 是否使用 htmlFor 将标签与控件关联；对于自定义控件（如下拉、树选择、复选框），请设为 false 以避免浏览器警告。
   */
  useHtmlFor?: boolean;
}

export function LabeledField<TFieldValues extends FieldValues = FieldValues>({
  control,
  name,
  label,
  required,
  children,
  itemClassName,
  labelClassName = "text-sm font-medium",
  useHtmlFor = true
}: LabeledFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name as any}
      render={({ field }) => (
        <FormItem className={itemClassName}>
          <FormLabel className={labelClassName} useHtmlFor={useHtmlFor}>
            {label} {required && <RequiredStar />}
          </FormLabel>
          <FormControl>{children(field)}</FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export default LabeledField;
