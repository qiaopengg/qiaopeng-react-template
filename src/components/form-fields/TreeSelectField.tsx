import type { Control, FieldValues } from "react-hook-form";
import type { SelectOption as TreeSelectOption } from "@/types/project-config";
// React import not required for modern JSX runtime
import { TreeSelectDropdown } from "@/components/Tree/TreeSelectDropdown";
import { LabeledField } from "./LabeledField";

interface TreeSelectFieldProps<TFieldValues extends FieldValues = FieldValues> {
  control: Control<TFieldValues>;
  name: keyof TFieldValues | string;
  label: string;
  data: TreeSelectOption[];
  placeholder: string;
  required?: boolean;
}

export function TreeSelectField<TFieldValues extends FieldValues = FieldValues>({
  control,
  name,
  label,
  data,
  placeholder,
  required
}: TreeSelectFieldProps<TFieldValues>) {
  return (
    <LabeledField<TFieldValues> control={control} name={name} label={label} required={required} useHtmlFor={false}>
      {(field) => (
        <TreeSelectDropdown
          data={data}
          value={field.value}
          onValueChange={(value) => {
            const selectedValue = Array.isArray(value) ? value[0] : value;
            field.onChange(selectedValue || "");
          }}
          config={{
            mode: "single",
            placeholder,
            searchPlaceholder: "搜索指标分类...",
            clearable: true,
            searchable: true,
            size: "default"
          }}
          className="h-9 w-full"
          onClear={() => field.onChange("")}
        />
      )}
    </LabeledField>
  );
}

export default TreeSelectField;
