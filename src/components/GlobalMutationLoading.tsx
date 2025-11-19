/**
 * 全局 Mutation Loading 状态指示器
 *
 * 功能：
 * - 显示当前正在进行的 mutation 操作数量
 * - 提供全局的操作反馈
 * - 自动在有操作时显示，无操作时隐藏
 *
 * 使用方式：
 * 在 App.tsx 或 Layout 组件中引入：
 * ```tsx
 * import { GlobalMutationLoading } from '@/components/GlobalMutationLoading';
 *
 * function App() {
 *   return (
 *     <>
 *       <GlobalMutationLoading />
 *       <YourApp />
 *     </>
 *   );
 * }
 * ```
 */

import { useIsMutating } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export function GlobalMutationLoading() {
  const mutatingCount = useIsMutating();

  // 没有正在进行的操作时不显示
  if (mutatingCount === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm font-medium">正在处理 {mutatingCount} 个操作...</span>
    </div>
  );
}

/**
 * 针对特定模块的 Mutation Loading 指示器
 *
 * 使用方式：
 * ```tsx
 * <ModuleMutationLoading mutationKey="design-stage" />
 * ```
 */
export function ModuleMutationLoading({ mutationKey }: { mutationKey: string }) {
  const mutatingCount = useIsMutating({ mutationKey: [mutationKey] });

  if (mutatingCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-md shadow-md">
      <Loader2 className="h-3 w-3 animate-spin" />
      <span className="text-xs">处理中...</span>
    </div>
  );
}
