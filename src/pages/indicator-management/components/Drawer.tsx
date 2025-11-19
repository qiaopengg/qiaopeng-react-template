import type { IIndicatorItem } from "../types";
import { lazy, Suspense } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

// 懒加载表单组件
const Form = lazy(() => import("./Form"));

interface DrawerProps {
  isOpen: boolean;
  editingItem: IIndicatorItem | null;
  onClose: () => void;
}

/**
 * 抽屉 - 纯渲染组件
 */
export function Drawer({ isOpen, editingItem, onClose }: DrawerProps) {
  return (
    <Sheet
      modal={false}
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="sm:max-w-[425px] p-0 flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle>{editingItem ? "编辑指标" : "新建指标"}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-hidden">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            }
          >
            <Form initialData={editingItem} onClose={onClose} />
          </Suspense>
        </div>
      </SheetContent>
    </Sheet>
  );
}
