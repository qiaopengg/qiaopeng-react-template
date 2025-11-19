import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";

interface LoginDialogContextType {
  isOpen: boolean;
  openLoginDialog: () => void;
  closeLoginDialog: () => void;
}

const LoginDialogContext = createContext<LoginDialogContextType | undefined>(undefined);

export function LoginDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openLoginDialog = () => setIsOpen(true);
  const closeLoginDialog = () => setIsOpen(false);

  return (
    <LoginDialogContext.Provider value={{ isOpen, openLoginDialog, closeLoginDialog }}>
      {children}
    </LoginDialogContext.Provider>
  );
}

export function useLoginDialog() {
  const context = useContext(LoginDialogContext);
  if (context === undefined) {
    throw new Error("useLoginDialog must be used within a LoginDialogProvider");
  }
  return context;
}

// 全局实例，用于在组件外部调用
let globalLoginDialog: LoginDialogContextType | null = null;

export function setGlobalLoginDialog(dialog: LoginDialogContextType) {
  globalLoginDialog = dialog;
}

export function openLoginDialog() {
  if (globalLoginDialog) {
    globalLoginDialog.openLoginDialog();
  }
}

export function closeLoginDialog() {
  if (globalLoginDialog) {
    globalLoginDialog.closeLoginDialog();
  }
}
