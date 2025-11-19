// 菜单查询 Hook - 使用重构后的 TanStack Query 工具
// 职责：提供菜单数据查询功能

import type { MenuItem } from "@/service/menu";

import { useQueryClient } from "@qiaopeng/tanstack-query-plus";
import { queryKeys } from "@qiaopeng/tanstack-query-plus/core";
import { useEnhancedQuery } from "@qiaopeng/tanstack-query-plus/hooks";
import { getTree } from "@/service/menu";

/**
 * 菜单查询键
 */
export const menuQueryKeys = {
  all: () => [...queryKeys.all, "menu"] as const,
  tree: () => [...menuQueryKeys.all(), "tree"] as const,
  router: () => [...menuQueryKeys.all(), "router"] as const
};

/**
 * 菜单查询 Hook
 * 使用静态配置，适合菜单这种相对静态的数据
 */
export function useMenuQuery() {
  return useEnhancedQuery({
    queryKey: menuQueryKeys.router(),
    queryFn: getTree,
    staleTime: 10 * 60 * 1000, // 10分钟，菜单数据相对静态
    gcTime: 30 * 60 * 1000, // 30分钟
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });
}

/**
 * 手动刷新菜单的 Hook
 */
export function useRefreshMenu() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({
      queryKey: menuQueryKeys.all()
    });
  };
}

/**
 * 预加载菜单数据的 Hook
 */
export function usePrefetchMenu() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.prefetchQuery({
      queryKey: menuQueryKeys.router(),
      queryFn: getTree,
      staleTime: 10 * 60 * 1000
    });
  };
}

/**
 * 获取缓存的菜单数据（不触发网络请求）
 */
export function useCachedMenuData(): MenuItem[] | undefined {
  const queryClient = useQueryClient();
  return queryClient.getQueryData(menuQueryKeys.router());
}

/**
 * 增强的菜单查询 Hook（带额外功能）
 */
export function useMenuQueryEnhanced() {
  const query = useMenuQuery();
  const refresh = useRefreshMenu();
  const prefetch = usePrefetchMenu();
  const cachedData = useCachedMenuData();

  return {
    ...query,
    refresh,
    prefetch,
    cachedData,
    isEmpty: !query.data || query.data.length === 0,
    hasData: Boolean(query.data && query.data.length > 0)
  };
}
