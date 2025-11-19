import type { Control, FieldValues } from "react-hook-form";
import type { UISelectOption } from "@/types/select";
// React import not required for modern JSX runtime
import { AdvancedSelect } from "@/components/Select/advanced-select";
import { selectDefaults } from "./constants";
import { LabeledField } from "./LabeledField";

interface SelectFieldProps<TFieldValues extends FieldValues = FieldValues> {
  control: Control<TFieldValues>;
  name: keyof TFieldValues | string;
  label: string;
  options: UISelectOption[];
  placeholder: string;
  mode?: "single" | "multiple";
  required?: boolean;
  /** 横向布局（label 和输入框在同一行） */
  horizontal?: boolean;
  /** 自定义输入框宽度 */
  className?: string;
}

export function SelectField<TFieldValues extends FieldValues = FieldValues>({
  control,
  name,
  label,
  options,
  placeholder,
  mode = "single",
  required,
  horizontal = false,
  className
}: SelectFieldProps<TFieldValues>) {
  return (
    <LabeledField<TFieldValues>
      control={control}
      name={name}
      label={label}
      required={required}
      useHtmlFor={false}
      itemClassName={horizontal ? "flex items-center gap-2" : undefined}
      labelClassName={horizontal ? "text-sm font-medium text-sidebar-foreground whitespace-nowrap" : undefined}
    >
      {(field) => (
        <AdvancedSelect
          options={options}
          value={field.value}
          onValueChange={field.onChange}
          config={{ mode, placeholder, ...selectDefaults }}
          className={className || "h-9 w-full"}
        />
      )}
    </LabeledField>
  );
}

export default SelectField;
