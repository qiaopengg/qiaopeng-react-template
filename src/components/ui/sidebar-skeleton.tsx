interface SidebarSkeletonProps {
  menuItems?: number;
  showHeader?: boolean;
}

export function SidebarSkeleton({ menuItems = 5, showHeader = true }: SidebarSkeletonProps) {
  return (
    <div className="w-full h-full">
      {/* Header skeleton */}
      {showHeader && (
        <div className="p-4 animate-pulse">
          <div className="h-6 bg-input rounded-md"></div>
        </div>
      )}

      {/* Menu groups skeleton */}
      <div className="px-3 space-y-2">
        {Array.from({ length: menuItems }).map((_, index) => (
          <div key={index} className="animate-pulse" style={{ animationDelay: `${index * 150}ms` }}>
            {/* 一级菜单项 */}
            <div className="px-3 py-2.5 rounded-lg bg-muted/50">
              <div className="flex items-center">
                {/* 图标骨架 */}
                <div className="w-4 h-4 mr-3 bg-input rounded"></div>
                {/* 文本骨架 */}
                <div className="flex-1 h-4 bg-input rounded max-w-[120px]"></div>
              </div>
            </div>

            {/* 二级菜单项 */}
            <div className="ml-4 mr-2 mt-1 space-y-0.5">
              {Array.from({ length: (index % 2) + 1 }).map((_, subIndex) => (
                <div
                  key={subIndex}
                  className="py-0.5 animate-pulse"
                  style={{ animationDelay: `${index * 150 + subIndex * 50}ms` }}
                >
                  <div className="px-3 py-2 rounded-lg bg-muted/50">
                    <div className="flex items-center">
                      {/* 二级图标骨架 */}
                      <div className="w-3.5 h-3.5 mr-2.5 bg-input rounded"></div>
                      {/* 二级文本骨架 */}
                      <div className="flex-1 h-3.5 bg-input rounded max-w-[100px]"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
