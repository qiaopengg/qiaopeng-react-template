/**
 * 持久化查询客户端提供者
 * 支持查询缓存持久化到 localStorage、离线状态检测、自动降级处理
 */

import type { QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider as TanStackPersistProvider } from "@tanstack/react-query-persist-client";
import { useEffect, useState } from "react";

import { isOnline, setupOnlineManager, subscribeToOnlineStatus } from "./features/offline";
import { clearCache, createPersister } from "./features/persistence";

/**
 * 持久化提供者组件属性
 * @property {ReactNode} children - 子组件
 * @property {QueryClient} client - QueryClient 实例
 * @property {string} [cacheKey="tanstack-query-cache"] - 持久化缓存键
 * @property {boolean} [enablePersistence=true] - 是否启用持久化（localStorage）
 * @property {boolean} [enableOfflineSupport=true] - 是否启用离线支持
 * @property {(error: Error) => void} [onPersistError] - 持久化失败回调
 * @property {() => void} [onPersistRestore] - 持久化恢复回调
 */
export interface PersistQueryClientProviderProps {
  children: ReactNode;
  client: QueryClient;
  cacheKey?: string;
  enablePersistence?: boolean;
  enableOfflineSupport?: boolean;
  onPersistError?: (error: Error) => void;
  onPersistRestore?: () => void;
}

/**
 * 带持久化功能的 QueryClient Provider
 * 自动持久化查询缓存到 localStorage、离线状态管理、失败自动降级、缓存有效期 24 小时
 *
 * @param {PersistQueryClientProviderProps} props - 组件属性
 * @returns {JSX.Element} Provider 组件
 */
export function PersistQueryClientProvider({
  children,
  client,
  cacheKey = "tanstack-query-cache",
  enablePersistence = true,
  enableOfflineSupport = true,
  onPersistError: _onPersistError,
  onPersistRestore
}: PersistQueryClientProviderProps) {
  // 配置离线支持
  useEffect(() => {
    if (enableOfflineSupport) {
      setupOnlineManager();
    }
  }, [enableOfflineSupport]);

  // 启用持久化
  if (enablePersistence) {
    const persister = createPersister(cacheKey);

    // 持久化器创建失败，降级到普通 Provider
    if (!persister) {
      return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    }

    return (
      <TanStackPersistProvider
        client={client}
        persistOptions={{
          persister,
          maxAge: 1000 * 60 * 60 * 24 // 24 小时
        }}
        onSuccess={onPersistRestore}
      >
        {children}
      </TanStackPersistProvider>
    );
  }

  // 不启用持久化，使用普通 Provider
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/**
 * 获取持久化状态 Hook
 * @returns {{ isOnline: boolean, isOffline: boolean }} 在线/离线状态
 */
export function usePersistenceStatus() {
  const [online, setOnline] = useState(isOnline());

  useEffect(() => {
    return subscribeToOnlineStatus(setOnline);
  }, []);

  return {
    isOnline: online,
    isOffline: !online
  };
}

/**
 * 持久化管理器 Hook
 * @returns {{ clearCache: (cacheKey?: string) => void, getOnlineStatus: () => boolean }} 缓存管理和在线状态检查方法
 */
export function usePersistenceManager() {
  const clearPersistenceCache = (cacheKey = "tanstack-query-cache") => {
    clearCache(cacheKey);
  };

  const getOnlineStatus = () => {
    return isOnline();
  };

  return {
    clearCache: clearPersistenceCache,
    getOnlineStatus
  };
}

export default PersistQueryClientProvider;
