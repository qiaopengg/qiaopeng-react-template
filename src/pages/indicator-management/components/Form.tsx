import type { IIndicatorItem } from "../types";
import {
  CascadingSelectField,
  LabeledField,
  selectDefaults,
  SelectField,
  ToggleField,
  TreeSelectField
} from "@/components/form-fields";
import { AdvancedSelect } from "@/components/Select/advanced-select";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormVM } from "../hooks/useForm";

// 逻辑已抽离到 hooks.ts 中，当前文件仅负责渲染

export function IndicatorForm({ onClose, initialData }: { onClose?: () => void; initialData?: IIndicatorItem | null }) {
  const {
    isLoadingConfig,
    form,
    onSubmit,
    isSubmitting,
    isEngineerSubcategoryEnabled,
    parameterClassifyTreeData,
    designStageSelectOptions,
    materialDirectorySelectOptions,
    businessLevelSelectOptions,
    dataTypeSelectOptions,
    reviewStageSelectOptions,
    professionSelectOptions,
    applicableScopeSelectOptions,
    engineeringCategoryOptions
  } = useFormVM(initialData, onClose);

  // 如果配置数据正在加载，显示加载状态
  if (isLoadingConfig) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">加载配置数据中...</p>
        </div>
      </div>
    );
  }

  // 通用字段组件已抽取至 @/components/form-fields

  return (
    <div className="h-full flex flex-col">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col">
          {/* 可滚动的表单内容区域 - 隐藏滚动条 */}
          <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide">
            <div className="space-y-4">
              <LabeledField control={form.control} name="parameterName" label="指标名称" required>
                {(field) => <Input placeholder="请输入指标名称" {...field} className="h-9" />}
              </LabeledField>

              <SelectField
                control={form.control}
                name="designPhaseId"
                label="设计阶段"
                options={designStageSelectOptions}
                placeholder="请选择设计阶段"
                required
              />

              <LabeledField
                control={form.control}
                name="meterialsIds"
                label="项目资料来源限定"
                required
                labelClassName="text-sm"
                useHtmlFor={false}
              >
                {(field) => (
                  <AdvancedSelect
                    options={materialDirectorySelectOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    config={{
                      mode: "multiple",
                      placeholder: "请选择项目资料来源",
                      showItemCount: true,
                      ...selectDefaults
                    }}
                    className="h-9 w-full"
                  />
                )}
              </LabeledField>

              <TreeSelectField
                control={form.control}
                name="parameterClassifyId"
                label="指标分类"
                data={parameterClassifyTreeData}
                placeholder="请选择指标分类"
                required
              />

              <SelectField
                control={form.control}
                name="engineerLevel"
                label="业务层级"
                options={businessLevelSelectOptions}
                placeholder="请选择业务层级"
                required
              />

              <CascadingSelectField
                control={form.control}
                label="所属工程子类"
                required={isEngineerSubcategoryEnabled}
                options={engineeringCategoryOptions}
                parentName="engineerCategoryId"
                childName="engineerCategorySubIds"
                parentPlaceholder="请选择工程类别"
                childPlaceholder="请选择工程子类"
                disabled={!isEngineerSubcategoryEnabled}
                className="h-9 w-full"
              />

              <SelectField
                control={form.control}
                name="dataType"
                label="数据类型"
                options={dataTypeSelectOptions}
                placeholder="请选择数据类型"
                required
              />

              <LabeledField control={form.control} name="stageIds" label="评审环节" required useHtmlFor={false}>
                {(field) => (
                  <AdvancedSelect
                    options={reviewStageSelectOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    config={{ mode: "multiple", placeholder: "请选择评审环节", ...selectDefaults }}
                    className="h-9 w-full"
                  />
                )}
              </LabeledField>

              <SelectField
                control={form.control}
                name="majorCategoryId"
                label="所属专业"
                options={professionSelectOptions}
                placeholder="请选择所属专业"
                required
              />

              <LabeledField
                control={form.control}
                name="applicableConditionIds"
                label="适用条件"
                required
                useHtmlFor={false}
              >
                {(field) => (
                  <AdvancedSelect
                    options={applicableScopeSelectOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    config={{ mode: "multiple", placeholder: "请选择适用条件", ...selectDefaults }}
                    className="h-9 w-full"
                  />
                )}
              </LabeledField>

              <div className="flex items-center justify-between">
                <ToggleField control={form.control} name="intermediateResult" label="是否为中间结果（前端不显示）" />

                <ToggleField control={form.control} name="enableStatus" label="是否启用" />
              </div>
            </div>
          </div>

          {/* 固定在底部的按钮区域 */}
          <div className="shrink-0 border-t bg-background px-6 py-4">
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (initialData ? "保存中..." : "创建中...") : initialData ? "保存" : "创建指标"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

// 默认导出以支持懒加载
export default IndicatorForm;
