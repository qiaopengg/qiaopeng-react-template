import type { MenuItem } from "@/service/menu";
import { Home, Menu } from "lucide-react";
import { useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { AppSidebar } from "@/components/App-sidebar";
import { GlobalMutationLoading } from "@/components/GlobalMutationLoading";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { useMenuQuery, usePrefetchMenu } from "@/hooks/useMenuQuery";
import { ModeToggle } from "./ModeToggle";
import { Toaster } from "./ui/sonner";
import { UserMenu } from "./UserMenu";

function HeaderContent() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="ml-auto flex items-center gap-3">
      <ModeToggle />
      {isAuthenticated && <UserMenu />}
    </div>
  );
}

// 查找菜单路径的辅助函数
function findMenuPath(menuData: MenuItem[], targetPath: string): MenuItem[] {
  const path: MenuItem[] = [];

  function search(items: MenuItem[], currentPath: MenuItem[]): boolean {
    for (const item of items) {
      const newPath = [...currentPath, item];

      // 检查当前项是否匹配
      if (item.url && targetPath.startsWith(item.url) && item.url !== "/") {
        path.splice(0, path.length, ...newPath);

        // 如果有子项，继续搜索更精确的匹配
        if (item.children && item.children.length > 0) {
          search(item.children, newPath);
        }
        return true;
      }

      // 搜索子项
      if (item.children && item.children.length > 0) {
        if (search(item.children, newPath)) {
          return true;
        }
      }
    }
    return false;
  }

  search(menuData, []);
  return path;
}

function Breadcrumb() {
  const location = useLocation();
  const { data: menuData = [] } = useMenuQuery();

  const getBreadcrumbItems = () => {
    const pathname = location.pathname;
    const items: Array<{
      title: string;
      icon: typeof Home;
      url: string;
      isActive: boolean;
    }> = [];

    // // 添加首页
    // items.push({
    //   title: "首页",
    //   icon: Home,
    //   url: "/",
    //   isActive: pathname === "/"
    // });

    // 如果不是首页，从菜单数据中查找路径
    if (pathname !== "/" && menuData.length > 0) {
      const menuPath = findMenuPath(menuData, pathname);

      // 添加菜单路径中的项目
      menuPath.forEach((menuItem, index) => {
        items.push({
          title: menuItem.title,
          icon: Home, // 使用统一图标，或者可以根据menuItem.icon动态设置
          url: menuItem.url,
          isActive: index === menuPath.length - 1 // 最后一项为激活状态
        });
      });
    }

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <div className="flex items-center space-x-1 sm:space-x-2">
      {breadcrumbItems.map((item, index) => (
        <div key={item.url} className="flex items-center">
          {index > 0 && (
            <span className="mx-1 sm:mx-2 text-muted-foreground">
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          )}
          {item.isActive ? (
            <div className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <item.icon className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline text-sm font-medium text-primary">{item.title}</span>
            </div>
          ) : (
            <Link
              to={item.url}
              className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
            >
              <item.icon className="w-4 h-4 text-muted-foreground" />
              <span className="hidden sm:inline text-sm font-medium text-foreground">{item.title}</span>
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

// 查找第一个可访问的菜单项
function findFirstAccessibleMenuItem(menuData: MenuItem[]): string | null {
  for (const item of menuData) {
    // 如果有URL且不是根路径，返回这个URL
    if (item.url && item.url !== "/") {
      return item.url;
    }

    // 如果有子项，递归查找
    if (item.children && item.children.length > 0) {
      const childUrl = findFirstAccessibleMenuItem(item.children);
      if (childUrl) {
        return childUrl;
      }
    }
  }
  return null;
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: menuData = [], isLoading } = useMenuQuery();
  const prefetchMenu = usePrefetchMenu();

  // 自动跳转到第一个菜单项
  useEffect(() => {
    prefetchMenu();
    // 只在根路径且菜单数据加载完成时执行跳转
    if (location.pathname === "/" && !isLoading && menuData.length > 0) {
      const firstMenuItem = findFirstAccessibleMenuItem(menuData);
      if (firstMenuItem) {
        navigate(firstMenuItem, { replace: true });
      }
    }
  }, [location.pathname, menuData, isLoading, navigate, prefetchMenu]);

  return (
    <SidebarProvider className="h-screen overflow-hidden bg-background">
      <AppSidebar />
      <SidebarInset className="flex flex-col h-full">
        <header className="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 sm:gap-4 border-b border-border px-3 sm:px-6 shadow-sm z-10">
          {/* 侧边栏触发器 */}
          <SidebarTrigger className="p-2 hover:bg-accent/50 rounded-lg transition-colors duration-200 group">
            <Menu className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </SidebarTrigger>

          <Separator orientation="vertical" className="h-6 bg-border hidden sm:block" />

          {/* 面包屑导航 */}
          <div className="flex-1 flex items-center min-w-0">
            <Breadcrumb />
          </div>

          {/* 用户操作区域 */}
          <HeaderContent />
        </header>

        <main className="flex-1 overflow-hidden bg-background p-3">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function Page() {
  return (
    <>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
      {/* 5. 全局 Mutation Loading 状态指示器 */}
      <GlobalMutationLoading />
      <Toaster />
    </>
  );
}
