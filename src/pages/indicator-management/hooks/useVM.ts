import type { ColumnDef } from "@tanstack/react-table";
import type { IIndicatorItem } from "../types";
import { useTableColumns } from "./useColumns";
import { useFormPrefetch, usePage, useParams, useSearchForm } from "./useList";

/**
 * 页面 ViewModel Hook
 * 整合所有业务逻辑，提供统一的接口给页面组件
 */
export function useVM() {
  "use no memo";
  // 1. 查询参数管理
  const { params: queryParams, updateParams } = useParams();

  // 2. 页面业务逻辑（CRUD 操作）
  const {
    isDrawerOpen,
    editingItem,
    deleteConfirmOpen,
    deletingItem,
    handleAdd,
    handleEdit,
    handleDelete,
    handleToggleStatus,
    handleClose,
    confirmDelete,
    cancelDelete
  } = usePage(queryParams);

  // 3. 搜索表单逻辑
  const { searchForm, projectTypeOptions, designStageOptions, handleSearchSubmit } = useSearchForm(
    queryParams,
    updateParams
  );

  // 4. 预取优化逻辑
  const { prefetchForm, handleAddWithPrefetch, handleEditWithPrefetch, prefetchHandlers } = useFormPrefetch(
    handleAdd,
    handleEdit
  );

  // 5. 表格列定义
  const columns: ColumnDef<IIndicatorItem>[] = useTableColumns(
    handleEditWithPrefetch,
    handleDelete,
    handleToggleStatus,
    prefetchForm
  );

  // 返回统一的 ViewModel 接口
  return {
    // 查询参数
    queryParams,

    // 搜索相关
    searchForm,
    projectTypeOptions,
    designStageOptions,
    handleSearchSubmit,

    // 页面状态
    isDrawerOpen,
    editingItem,
    deleteConfirmOpen,
    deletingItem,

    // 操作方法
    handleAddWithPrefetch,
    handleClose,
    confirmDelete,
    cancelDelete,

    // 预取相关
    prefetchHandlers,

    // 表格
    columns
  };
}
