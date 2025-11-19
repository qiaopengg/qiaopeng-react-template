import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Database, HardDrive, Network, RefreshCw, Trash2, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface PersistenceStatusProps {
  className?: string;
}

export function PersistenceStatus({ className }: PersistenceStatusProps) {
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cacheStats, setCacheStats] = useState({
    totalQueries: 0,
    cachedQueries: 0,
    storageUsed: 0
  });

  // 监听网络状态变化
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 获取缓存统计信息
  useEffect(() => {
    function updateCacheStats() {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();

      const totalQueries = queries.length;
      const cachedQueries = queries.filter((query) => query.state.data !== undefined).length;

      // 估算存储使用量
      let storageUsed = 0;
      try {
        const cacheData = localStorage.getItem("REACT_QUERY_OFFLINE_CACHE");
        if (cacheData) {
          storageUsed = new Blob([cacheData]).size;
        }
      } catch {
        // 忽略错误
      }

      setCacheStats({
        totalQueries,
        cachedQueries,
        storageUsed
      });
    }

    updateCacheStats();

    // 定期更新统计信息
    const interval = setInterval(updateCacheStats, 2000);

    return () => clearInterval(interval);
  }, [queryClient]);

  // 格式化字节大小
  function formatBytes(bytes: number): string {
    if (bytes === 0) {
      return "0 B";
    }

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  }

  // 清除所有缓存
  function handleClearCache() {
    queryClient.clear();
    localStorage.removeItem("REACT_QUERY_OFFLINE_CACHE");
  }

  // 刷新所有查询
  function handleRefreshAll() {
    queryClient.invalidateQueries();
  }

  // 模拟网络状态切换
  function handleToggleNetwork() {
    if (isOnline) {
      window.dispatchEvent(new Event("offline"));
      setIsOnline(false);
    } else {
      window.dispatchEvent(new Event("online"));
      setIsOnline(true);
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              持久化状态
            </CardTitle>
            <CardDescription className="text-xs">TanStack Query 缓存和网络状态</CardDescription>
          </div>
          <Badge variant={isOnline ? "default" : "destructive"} className="text-xs">
            {isOnline ? (
              <>
                <Wifi className="h-3 w-3 mr-1" />
                在线
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 mr-1" />
                离线
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 缓存统计 */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Network className="h-3 w-3" />
              查询缓存
            </div>
            <div className="font-medium">
              {cacheStats.cachedQueries} / {cacheStats.totalQueries}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <HardDrive className="h-3 w-3" />
              存储使用
            </div>
            <div className="font-medium">{formatBytes(cacheStats.storageUsed)}</div>
          </div>
        </div>

        <Separator />

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefreshAll} className="flex-1 text-xs h-7">
            <RefreshCw className="h-3 w-3 mr-1" />
            刷新
          </Button>

          <Button variant="outline" size="sm" onClick={handleClearCache} className="flex-1 text-xs h-7">
            <Trash2 className="h-3 w-3 mr-1" />
            清除
          </Button>
        </div>

        {/* 网络模拟 */}
        <Button
          variant={isOnline ? "destructive" : "default"}
          size="sm"
          onClick={handleToggleNetwork}
          className="w-full text-xs h-7"
        >
          {isOnline ? (
            <>
              <WifiOff className="h-3 w-3 mr-1" />
              模拟离线
            </>
          ) : (
            <>
              <Wifi className="h-3 w-3 mr-1" />
              恢复在线
            </>
          )}
        </Button>

        {/* 提示信息 */}
        {!isOnline && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
            <AlertTriangle className="h-3 w-3 inline mr-1" />
            离线模式：数据来自本地缓存
          </div>
        )}
      </CardContent>
    </Card>
  );
}
