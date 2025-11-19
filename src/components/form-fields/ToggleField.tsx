import type { Control, FieldValues } from "react-hook-form";
// React import not required for modern JSX runtime
import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";

interface ToggleFieldProps<TFieldValues extends FieldValues = FieldValues> {
  control: Control<TFieldValues>;
  name: keyof TFieldValues | string;
  label: string;
}

export function ToggleField<TFieldValues extends FieldValues = FieldValues>({
  control,
  name,
  label
}: ToggleFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name as any}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center gap-2">
          <FormControl>
            <Checkbox checked={field.value === 1} onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)} />
          </FormControl>
          <FormLabel className="text-sm font-medium" useHtmlFor={false}>
            {label}
          </FormLabel>
        </FormItem>
      )}
    />
  );
}

export default ToggleField;
