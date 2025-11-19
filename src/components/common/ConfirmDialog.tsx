import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  icon?: ReactNode;
}

/**
 * 通用确认对话框组件
 * 支持自定义标题、描述、按钮文本和样式变体
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title = "确认操作",
  description,
  confirmText = "确认",
  cancelText = "取消",
  variant = "danger",
  icon
}: ConfirmDialogProps) {
  // 根据变体设置样式
  const variantStyles = {
    danger: {
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      buttonClass: "bg-red-600 hover:bg-red-700 focus:ring-red-600"
    },
    warning: {
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      buttonClass: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-600"
    },
    info: {
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      buttonClass: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-600"
    }
  };

  const styles = variantStyles[variant];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange || onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${styles.iconBg}`}>
              {icon || <AlertTriangle className={`h-5 w-5 ${styles.iconColor}`} />}
            </div>
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          {description && <AlertDialogDescription className="pt-2">{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className={styles.buttonClass}>
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
