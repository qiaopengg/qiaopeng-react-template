import { createBrowserRouter } from "react-router";
import ErrorBoundary from "./components/ErrorBoundary";

import { ProtectedRoute } from "./components/ProtectedRoute";

// 加载中组件
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-muted-foreground">加载中...</div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/login",
    HydrateFallback: LoadingFallback,
    lazy: async () => {
      const LoginPage = (await import("./pages/login/page.tsx")).default;
      return {
        Component: LoginPage
      };
    }
  },
  {
    path: "/",
    HydrateFallback: LoadingFallback,
    lazy: async () => {
      const module = await import("./components/Layout");
      return {
        Component: module.default,
        ErrorBoundary
      };
    },
    children: [
      {
        path: "/indicator-management",
        lazy: async () => {
          const IndicatorManagementPage = (await import("./pages/indicator-management/page.tsx")).default;
          return {
            Component: () => (
              <ProtectedRoute>
                <IndicatorManagementPage />
              </ProtectedRoute>
            )
          };
        }
      },
      {
        index: true,
        element: (
          <ProtectedRoute>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground mb-2">欢迎使用智能代码审查系统</h2>
                <p className="text-muted-foreground">请从左侧菜单选择功能模块</p>
              </div>
            </div>
          </ProtectedRoute>
        )
      },
      {
        path: "*",
        element: (
          <ProtectedRoute>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground mb-2">页面开发中</h2>
                <p className="text-muted-foreground">该功能正在开发中，敬请期待！</p>
              </div>
            </div>
          </ProtectedRoute>
        )
      }
    ]
  }
]);
