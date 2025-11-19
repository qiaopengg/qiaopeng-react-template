import { ConfirmDialog } from "@/components/common";
import { Drawer, SearchBar, TableSection } from "./components";
import { useVM } from "./hooks/useVM";

/**
 * 指标管理页面
 * 使用 VM hook 管理业务逻辑，组合子组件完成渲染
 */
export default function IndicatorManagementPage() {
  const {
    queryParams,
    searchForm,
    projectTypeOptions,
    designStageOptions,
    handleSearchSubmit,
    isDrawerOpen,
    editingItem,
    deleteConfirmOpen,
    deletingItem,
    handleAddWithPrefetch,
    handleClose,
    confirmDelete,
    cancelDelete,
    prefetchHandlers,
    columns
  } = useVM();

  return (
    <div className="flex flex-col h-full bg-background">
      {/* 顶部搜索条 */}
      <SearchBar
        searchForm={searchForm}
        projectTypeOptions={projectTypeOptions}
        designStageOptions={designStageOptions}
        onSearchSubmit={handleSearchSubmit}
        onAdd={handleAddWithPrefetch}
        prefetchHandlers={prefetchHandlers}
      />

      {/* 底部表格区域 */}
      <TableSection queryParams={queryParams} columns={columns} />

      {/* 抽屉组件 */}
      <Drawer isOpen={isDrawerOpen} editingItem={editingItem} onClose={handleClose} />

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        title="确认删除"
        description={
          <>
            确定要删除 <span className="font-semibold text-foreground">"{deletingItem?.parameterName}"</span> 吗？
            此操作不可恢复。
          </>
        }
        confirmText="确认删除"
        cancelText="取消"
        variant="danger"
      />
    </div>
  );
}
