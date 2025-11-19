import { http } from "@/lib/http";

// 菜单项接口定义
export interface MenuItem {
  id: string;
  url: string;
  title: string;
  icon: string;
  order: number;
  children: MenuItem[];
}

// API 响应接口定义
export interface MenuResponse {
  code: number;
  message: string;
  data: MenuItem[];
}

// 获取菜单路由数据
export function getTree(): Promise<MenuItem[]> {
  return http.get<MenuItem[]>("/mainMenu/getTree");
}
