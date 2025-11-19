import { useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { setGlobalLoginDialog, useLoginDialog } from "@/hooks/use-login-dialog";
import { LoginForm } from "./Login-form";

export function LoginDialog() {
  const { isOpen, closeLoginDialog, openLoginDialog } = useLoginDialog();

  // 设置全局登录对话框实例
  useEffect(() => {
    setGlobalLoginDialog({ isOpen, openLoginDialog, closeLoginDialog });
  }, [isOpen, openLoginDialog, closeLoginDialog]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeLoginDialog();
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>用户登录</DialogTitle>
          <DialogDescription>请输入您的账户信息以登录系统</DialogDescription>
        </DialogHeader>
        <LoginForm />
      </DialogContent>
    </Dialog>
  );
}
