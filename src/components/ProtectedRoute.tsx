import type { ReactNode } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isUrlTokenProcessing, isUrlTokenChecked } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // 只有当认证加载完成、未登录、URL令牌检查完成且没有正在处理的URL令牌时，才跳转到登录页面
    if (!isLoading && !isAuthenticated && isUrlTokenChecked && !isUrlTokenProcessing) {
      // 保存当前路径用于登录后返回
      const currentPath = window.location.pathname + window.location.search;
      if (currentPath !== "/" && currentPath !== "/login") {
        sessionStorage.setItem("redirectAfterLogin", currentPath);
      }
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, isLoading, isUrlTokenChecked, isUrlTokenProcessing, navigate]);

  // 如果正在加载认证状态或处理URL令牌，显示加载状态
  if (isLoading || isUrlTokenProcessing) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">正在验证登录状态...</p>
        </div>
      </div>
    );
  }

  // // 如果未登录，显示未登录提示
  // if (!isAuthenticated) {
  //   return (
  //     fallback || (
  //       <div className="flex items-center justify-center h-full">
  //         <div className="text-center">
  //           <h2 className="text-xl font-semibold mb-2">需要登录</h2>
  //           <p className="text-muted-foreground">请先登录后再访问此页面</p>
  //         </div>
  //       </div>
  //     )
  //   );
  // }

  return <>{children}</>;
}
