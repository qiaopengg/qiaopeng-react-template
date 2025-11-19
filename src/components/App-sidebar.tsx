import { BarChart3, BookOpen, ChevronRight, FileCheck, FileText, Folder, Settings, Users } from "lucide-react";
import * as React from "react";
import { useEffect } from "react";

import { Link, useLocation, useNavigate } from "react-router";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from "@/components/ui/sidebar";
import { SidebarSkeleton } from "@/components/ui/sidebar-skeleton";
import { useMenuQuery } from "@/hooks/useMenuQuery";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const navigate = useNavigate();

  // 使用新的菜单查询 Hook
  const { data: menuData = [], isLoading: loading, isError, refetch } = useMenuQuery();

  // 图标映射函数
  const getMenuIcon = (title: string, url: string) => {
    // 根据URL路径匹配图标
    if (url.includes("indicator-management")) {
      return BarChart3;
    }
    if (url.includes("user-management")) {
      return Users;
    }
    if (url.includes("project-config")) {
      return Settings;
    }
    if (url.includes("knowledge-cases")) {
      return BookOpen;
    }
    if (url.includes("review-rule")) {
      return FileCheck;
    }
    if (url.includes("writing-templates")) {
      return FileText;
    }

    // 根据标题匹配图标（备用方案）
    if (title.includes("指标") || title.includes("统计")) {
      return BarChart3;
    }
    if (title.includes("用户") || title.includes("人员")) {
      return Users;
    }
    if (title.includes("配置") || title.includes("设置")) {
      return Settings;
    }
    if (title.includes("知识") || title.includes("案例")) {
      return BookOpen;
    }
    if (title.includes("规则") || title.includes("评审")) {
      return FileCheck;
    }
    if (title.includes("模板") || title.includes("写作")) {
      return FileText;
    }

    // 默认图标
    return Folder;
  };

  // 监听路由变化，保存项目配置子路由到 sessionStorage
  useEffect(() => {
    const currentPath = location.pathname;

    // 如果当前路径是项目配置的子路由，保存到 sessionStorage
    if (currentPath.startsWith("/project-config/")) {
      sessionStorage.setItem("lastProjectConfigRoute", currentPath);
    }
  }, [location.pathname]);

  const isActive = (url: string) => {
    // 统一处理：确保 url 以 / 开头，避免相对路径导致匹配失败
    const fullUrl = url.startsWith("/") ? url : `/${url}`;

    if (fullUrl === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(fullUrl);
  };

  // 处理菜单点击，防止重复导航
  const handleMenuClick = (e: React.MouseEvent, targetUrl: string) => {
    const currentPath = location.pathname;

    // 如果点击的是当前激活的菜单项，阻止默认行为
    if (currentPath === targetUrl) {
      e.preventDefault();
      return;
    }

    // 项目配置菜单的特殊处理
    if (targetUrl === "/project-config") {
      e.preventDefault();

      // 检查 sessionStorage 中是否有最后访问的项目配置子路由
      const lastProjectConfigRoute = sessionStorage.getItem("lastProjectConfigRoute");

      // 定义有效的项目配置子路由
      const validSubRoutes = [
        "/project-config/design-stage",
        "/project-config/project-type",
        "/project-config/applicable-conditions",
        "/project-config/material-catalog",
        "/project-config/indicator-classification",
        "/project-config/rule-classification",
        "/project-config/professional-classification",
        "/project-config/review-process"
      ];

      // 如果有有效的最后访问路由，跳转到该路由
      if (lastProjectConfigRoute && validSubRoutes.includes(lastProjectConfigRoute)) {
        navigate(lastProjectConfigRoute);
      } else {
        // 否则跳转到默认的 design-stage
        navigate("/project-config/design-stage");
      }
    }
  };

  return (
    <Sidebar {...props} className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="h-16 border-b border-sidebar-border flex flex-row  items-center">
        <h1 className="text-lg h-16 font-bold text-primary flex items-center">LOGO</h1>
        <h1 className="text-lg h-16 font-bold text-primary flex items-center">智能评审管理后台</h1>
      </SidebarHeader>
      <SidebarContent className="gap-2 p-2 overflow-auto">
        {/* We create a collapsible SidebarGroup for each parent. */}
        {loading ? (
          <SidebarSkeleton menuItems={4} showHeader={false} />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center p-4">
            <div className="text-sm text-red-500 mb-2">菜单加载失败</div>
            <button onClick={() => refetch()} className="text-xs text-blue-500 hover:underline">
              重新加载
            </button>
          </div>
        ) : (
          menuData.map((item) => {
            const parentActive = item.url ? isActive(item.url) : false;

            return (
              <Collapsible key={item.title} title={item.title} defaultOpen className="group/collapsible">
                <SidebarGroup>
                  <SidebarGroupLabel asChild className="group/label text-sidebar-foreground text-base font-medium">
                    {item.children && item.children.length > 0 ? (
                      <div className="w-full">
                        <CollapsibleTrigger
                          className={`w-full px-3 py-2.5 rounded-lg transition-all duration-200 ${
                            parentActive
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          }`}
                        >
                          <div className="flex items-center">
                            {React.createElement(getMenuIcon(item.title, item.url || ""), {
                              className: `w-4 h-4 mr-3 transition-colors duration-200 ${
                                parentActive
                                  ? "text-primary"
                                  : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground"
                              }`
                            })}
                            <span
                              className={`text-sm font-medium transition-colors duration-200 ${
                                parentActive
                                  ? "text-primary"
                                  : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground"
                              }`}
                            >
                              {item.title}
                            </span>
                            <ChevronRight
                              className={`ml-auto h-4 w-4 transition-all duration-200 group-data-[state=open]/collapsible:rotate-90 ${
                                parentActive
                                  ? "text-primary"
                                  : "text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground"
                              }`}
                            />
                          </div>
                        </CollapsibleTrigger>
                      </div>
                    ) : (
                      <Link
                        to={item.url || "/"}
                        className="w-full block group"
                        onClick={(e) => handleMenuClick(e, item.url || "/")}
                      >
                        <div
                          className={`w-full px-3 py-2.5 rounded-lg transition-all duration-200 ${
                            parentActive
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          }`}
                        >
                          <div className="flex items-center">
                            {React.createElement(getMenuIcon(item.title, item.url || ""), {
                              className: `w-4 h-4 mr-3 transition-colors duration-200 ${
                                parentActive
                                  ? "text-primary"
                                  : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground"
                              }`
                            })}
                            <span
                              className={`text-sm font-medium transition-colors duration-200 ${
                                parentActive
                                  ? "text-primary"
                                  : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground"
                              }`}
                            >
                              {item.title}
                            </span>
                          </div>
                        </div>
                      </Link>
                    )}
                  </SidebarGroupLabel>
                  {item.children && item.children.length > 0 && (
                    <CollapsibleContent className="mt-1">
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {item.children.map((subItem) => (
                            <SidebarMenuItem key={subItem.title} className="ml-4 mr-2 py-0.5">
                              <SidebarMenuButton
                                asChild
                                isActive={isActive(subItem.url)}
                                className={`text-sm rounded-lg transition-all duration-200 group ${
                                  isActive(subItem.url)
                                    ? "!bg-primary/10 !text-primary !border !border-primary/20"
                                    : "hover:bg-sidebar-accent hover:shadow-sm"
                                }`}
                              >
                                <Link
                                  to={subItem.url || "/"}
                                  className="px-3 py-2 block"
                                  onClick={(e) => handleMenuClick(e, subItem.url || "/")}
                                >
                                  <div className="flex items-center">
                                    {React.createElement(getMenuIcon(subItem.title, subItem.url || ""), {
                                      className: `w-3.5 h-3.5 mr-2.5 transition-colors duration-200 ${
                                        isActive(subItem.url)
                                          ? "text-primary"
                                          : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground"
                                      }`
                                    })}
                                    <span
                                      className={`transition-colors duration-200 ${
                                        isActive(subItem.url)
                                          ? "text-primary font-medium"
                                          : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground group-hover:font-medium"
                                      }`}
                                    >
                                      {subItem.title}
                                    </span>
                                  </div>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </CollapsibleContent>
                  )}
                </SidebarGroup>
              </Collapsible>
            );
          })
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
