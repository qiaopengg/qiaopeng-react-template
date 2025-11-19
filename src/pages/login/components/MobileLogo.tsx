/**
 * 移动端 Logo 组件
 */
import { Brain } from "lucide-react";

export function MobileLogo() {
  return (
    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
      <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
        <Brain className="w-7 h-7 text-white" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">智能评审系统</h1>
      </div>
    </div>
  );
}
