import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DataTablePaginationProps {
  total: number; // 服务端分页的总数
}

export function DataTablePagination({ total }: DataTablePaginationProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // 从 URL 参数中获取分页信息
  const currentPage = Number(searchParams.get("currentPage")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 20;

  // 计算总页数
  const totalPages = Math.ceil(total / pageSize) || 1;

  // 计算当前显示的项目范围
  const startItem = total > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = total > 0 ? Math.min(currentPage * pageSize, total) : 0;

  // 更新 URL 参数
  const updateUrl = (newParams: Record<string, string>) => {
    const newSearchParams = new URLSearchParams(searchParams);

    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        newSearchParams.set(key, value);
      } else {
        newSearchParams.delete(key);
      }
    });

    navigate(`?${newSearchParams.toString()}`);
  };

  // 页码变化
  const handlePageChange = (page: number) => {
    updateUrl({ currentPage: page.toString() });
  };

  // 每页条数变化
  const handlePageSizeChange = (newPageSize: string) => {
    updateUrl({
      currentPage: "1", // 重置到第一页
      pageSize: newPageSize
    });
  };
  return (
    <div className="border-t">
      {/* 桌面端布局 */}
      <div className="hidden lg:flex items-center justify-between px-6 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {total > 0 ? `显示第 ${startItem}-${endItem} 项，共 ${total} 项` : "暂无数据"}
        </div>
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">每页</p>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize.toString()} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 50].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm font-medium">项</p>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            第 {currentPage} 页 共 {totalPages} 页
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => handlePageChange(1)}
              disabled={currentPage <= 1 || total === 0}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || total === 0}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || total === 0}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage >= totalPages || total === 0}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight />
            </Button>
          </div>
        </div>
      </div>

      {/* 移动端布局 */}
      <div className="lg:hidden px-4 py-3 space-y-3">
        {/* 第一行：页码信息和导航 */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            第 {currentPage}/{totalPages} 页
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || total === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || total === 0}
            >
              下一页
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* 第二行：数据信息和每页条数 */}
        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground">共 {total} 项</div>
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground">每页</span>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-8 w-16 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 50].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">项</span>
          </div>
        </div>
      </div>
    </div>
  );
}
