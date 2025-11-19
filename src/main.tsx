import { QueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { PersistQueryClientProvider } from "@/lib/tanstackQuery";

import { setupFocusManager } from "@/lib/tanstackQuery/core";
import { getConfigByEnvironment } from "@/lib/tanstackQuery/core/config";
import { router } from "./router";
import "./index.css";
import "./config/env";

// 创建 QueryClient 实例 - 使用环境配置
const queryClient = new QueryClient({
  // 根据当前构建环境选择配置：development / production / test
  defaultOptions: getConfigByEnvironment(import.meta.env.MODE as "development" | "production" | "test")
});

// 初始化全局焦点管理器事件监听（可根据需要传入 customEventListener）
setupFocusManager();

// 仅在开发和测试环境加载 DevTools（生产环境不加载、不显示）
const Devtools =
  import.meta.env.MODE !== "production"
    ? lazy(() => import("@tanstack/react-query-devtools").then((m) => ({ default: m.ReactQueryDevtools })))
    : null;

const App = (
  <PersistQueryClientProvider
    client={queryClient}
    cacheKey="tanstack-query-cache"
    enablePersistence={true}
    enableOfflineSupport={true}
    onPersistError={(error) => {
      console.error("持久化错误:", error);
    }}
    onPersistRestore={() => {
      console.log("缓存数据已恢复");
    }}
  >
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true} storageKey="app-theme">
      <RouterProvider router={router} />
      {Devtools && (
        <Suspense fallback={null}>
          <Devtools initialIsOpen={false} />
        </Suspense>
      )}
    </ThemeProvider>
  </PersistQueryClientProvider>
);

createRoot(document.getElementById("root")!).render(
  import.meta.env.MODE !== "production" ? <StrictMode>{App}</StrictMode> : App
);
