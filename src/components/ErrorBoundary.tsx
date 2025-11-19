import { useRouteError } from "react-router";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary() {
  const error = useRouteError();

  console.error("🚨 Home 页面加载错误:", error);
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-red-600 mb-2">页面加载失败</h1>
        <div className="space-x-3">
          <Button onClick={() => window.location.reload()} variant="default">
            重新加载
          </Button>
          <Button onClick={() => window.history.back()} variant="outline">
            返回上页
          </Button>
        </div>
      </div>
    </div>
  );
}
