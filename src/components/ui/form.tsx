import type * as LabelPrimitive from "@radix-ui/react-label";
import type { ControllerProps, FieldPath, FieldValues } from "react-hook-form";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { Controller, FormProvider, useFormContext, useFormState } from "react-hook-form";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const Form = FormProvider;

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
}

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue);

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ ...props }: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

function useFormField() {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState
  };
}

interface FormItemContextValue {
  id: string;
}

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div data-slot="form-item" className={cn("grid gap-2", className)} {...props} />
    </FormItemContext.Provider>
  );
}

interface FormLabelProps extends React.ComponentProps<typeof LabelPrimitive.Root> {
  /**
   * 是否使用 htmlFor 与控件进行关联。
   * 当控件不是可被 label 关联的原生表单元素（如自定义下拉、Radix Checkbox 等）时，应关闭以避免浏览器警告。
   */
  useHtmlFor?: boolean;
}

function FormLabel({ className, useHtmlFor = true, ...props }: FormLabelProps) {
  const { error, formItemId } = useFormField();

  // 为 ARIA 关联准备一个 label 的 id
  const formLabelId = `${formItemId}-label`;
  // 对于原生可被 label 关联的控件，使用真实的 <label> 元素
  if (useHtmlFor) {
    return (
      <Label
        data-slot="form-label"
        data-error={!!error}
        id={formLabelId}
        className={cn("data-[error=true]:text-destructive", className)}
        htmlFor={formItemId}
        {...props}
      />
    );
  }

  // 对于自定义控件（不可被 label 关联），使用非 label 元素以避免浏览器的“未关联 label”警告
  // 同时依然提供 id，供控件通过 aria-labelledby 建立语义关联
  const { htmlFor: _omitHtmlFor, ...restProps } = props as any;
  return (
    <span
      data-slot="form-label"
      data-error={!!error}
      id={formLabelId}
      className={cn("data-[error=true]:text-destructive", className)}
      {...restProps}
    />
  );
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  // 与 FormLabel 通过 ARIA 进行关联（对所有控件安全），点击 label 的可点击行为由控件自身决定
  const formLabelId = `${formItemId}-label`;

  return (
    <Slot
      data-slot="form-control"
      id={formItemId}
      aria-labelledby={formLabelId}
      aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={!!error}
      {...props}
    />
  );
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { formDescriptionId } = useFormField();

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message ?? "") : props.children;

  if (!body) {
    return null;
  }

  return (
    <p data-slot="form-message" id={formMessageId} className={cn("text-destructive text-sm", className)} {...props}>
      {body}
    </p>
  );
}

export { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, useFormField };
