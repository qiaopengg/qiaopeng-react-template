import type { IIndicatorItem, IIndicatorQueryParams, SearchFormValues } from "../types";
import { zodResolver } from "@hookform/resolvers/zod";
import { TIME_CONSTANTS } from "@qiaopeng/tanstack-query-plus/core";
import { useEnhancedQuery } from "@qiaopeng/tanstack-query-plus/hooks";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { IndicatorStatus } from "@/constants/indicator";
import { createPrefetchedActions, createPrefetchHandlers, usePrefetch } from "@/hooks/usePrefetch";
import { useQueryParams } from "@/hooks/useQueryParams";
import { projectConfigService } from "@/service/project-config";
import { useDeleteMutation, useToggleStatusMutation } from "../api";
import { formConfigQueryOptions } from "../shared";

// ==================== 搜索表单相关 ====================

// 搜索表单验证 schema
const searchFormSchema = z.object({
  projectTypeId: z.string().optional(),
  designPhaseId: z.string().optional()
});


/**
 * 查询参数 Hook
 */
export function useParams() {
  return useQueryParams<IIndicatorQueryParams>({
    defaults: {
      currentPage: 1,
      pageSize: 10,
      projectTypeId: undefined,
      designPhaseId: undefined
    },
    filterKeys: ["projectTypeId", "designPhaseId"],
    pageKey: "page",
    pageSizeKey: "pageSize",
    pageFieldName: "currentPage",
    pageSizeFieldName: "pageSize"
  });
}

/**
 * 搜索表单逻辑 Hook
 */
export function useSearchForm(
  queryParams: IIndicatorQueryParams,
  updateParams: (params: Partial<IIndicatorQueryParams>) => void
) {
  // 表单状态管理
  const searchForm = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      projectTypeId: (queryParams.projectTypeId as string | undefined) || undefined,
      designPhaseId: (queryParams.designPhaseId as string | undefined) || undefined
    }
  });

  // 获取搜索配置数据
  const { data: searchConfigData } = useEnhancedQuery({
    queryKey: ["project-config", "project-type,design-phases"],
    queryFn: () => projectConfigService.getProjectConfig({ configTypes: "project-type,design-phases" }),
    staleTime: TIME_CONSTANTS.THIRTY_MINUTES,
    gcTime: TIME_CONSTANTS.ONE_HOUR
  });

  // 转换为选项格式
  const projectTypeOptions = searchConfigData?.["project-type"] || [];
  const designStageOptions = searchConfigData?.["design-phases"] || [];

  // 处理搜索提交（自动重置页码）
  const handleSearchSubmit = (values: SearchFormValues) => {
    updateParams({
      projectTypeId: values.projectTypeId,
      designPhaseId: values.designPhaseId
    });
  };

  return {
    searchForm,
    projectTypeOptions,
    designStageOptions,
    handleSearchSubmit
  };
}

/**
 * 页面业务逻辑 Hook
 */
export function usePage(queryParams: IIndicatorQueryParams) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IIndicatorItem | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<IIndicatorItem | null>(null);

  const deleteMutation = useDeleteMutation(queryParams);
  const toggleStatusMutation = useToggleStatusMutation(queryParams);

  // 处理删除操作 - 显示确认对话框
  const handleDelete = (item: IIndicatorItem) => {
    setDeletingItem(item);
    setDeleteConfirmOpen(true);
  };

  // 确认删除
  const confirmDelete = () => {
    if (!deletingItem) {
      return;
    }

    deleteMutation.mutate(deletingItem.id, {
      onSuccess: () => {
        toast.success("删除成功");
        setDeleteConfirmOpen(false);
        setDeletingItem(null);
      },
      onError: (error: Error) => {
        toast.error(error.message || "删除失败");
      }
    });
  };

  // 取消删除
  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setDeletingItem(null);
  };

  // 处理编辑操作
  const handleEdit = (item: IIndicatorItem) => {
    setEditingItem(item);
    setIsDrawerOpen(true);
  };

  // 处理新增操作
  const handleAdd = () => {
    setEditingItem(null);
    setIsDrawerOpen(true);
  };

  // 处理启用/停用操作
  const handleToggleStatus = (item: IIndicatorItem) => {
    const newStatus = IndicatorStatus.toggle(item.enableStatus);

    toggleStatusMutation.mutate(
      { id: item.id, status: newStatus },
      {
        onSuccess: (success) => {
          if (success !== false) {
            toast.success(IndicatorStatus.getLabel(newStatus) === "已启用" ? "启用成功" : "停用成功");
          }
        },
        onError: (error: Error) => {
          toast.error(error.message || (IndicatorStatus.isEnabled(newStatus) ? "启用失败" : "停用失败"));
        }
      }
    );
  };

  // 处理抽屉关闭
  const handleClose = (open?: boolean) => {
    setIsDrawerOpen(open ?? false);
    if (open === false || open === undefined) {
      setEditingItem(null);
    }
  };

  return {
    isDrawerOpen,
    editingItem,
    deleteConfirmOpen,
    deletingItem,
    handleAdd,
    handleClose,
    handleEdit,
    handleDelete,
    handleToggleStatus,
    confirmDelete,
    cancelDelete
  };
}

// ==================== 预取优化 ====================

/**
 * 表单预取逻辑 Hook
 */
export function useFormPrefetch(handleAdd: () => void, handleEdit: (item: IIndicatorItem) => void) {
  // 使用通用预取 Hook
  const { prefetch: prefetchForm } = usePrefetch({
    queryOptions: formConfigQueryOptions(),
    componentImport: () => import("../components/Form"),
    once: false
  });

  // 创建预取增强的操作函数
  const { handleAdd: handleAddWithPrefetch, handleEdit: handleEditWithPrefetch } = useMemo(
    () =>
      createPrefetchedActions(
        {
          handleAdd,
          handleEdit
        },
        prefetchForm
      ),
    [handleAdd, handleEdit, prefetchForm]
  );

  // 创建预取事件处理器（hover 和 focus 时预取）
  const prefetchHandlers = useMemo(
    () =>
      createPrefetchHandlers(prefetchForm, {
        onHover: true,
        onFocus: true
      }),
    [prefetchForm]
  );

  return {
    prefetchForm,
    handleAddWithPrefetch,
    handleEditWithPrefetch,
    prefetchHandlers
  };
}
