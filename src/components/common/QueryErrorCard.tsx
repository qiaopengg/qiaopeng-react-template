import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  title?: string;
  message?: string;
  retryText?: string;
  onRetry?: () => void;
  className?: string;
}

export function QueryErrorCard({
  title = "加载失败",
  message = "发生了一些错误，请稍后重试",
  retryText = "重试",
  onRetry,
  className
}: Props) {
  return (
    <div
      className={cn(
        "flex min-h-[400px] flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500",
        className
      )}
    >
      {/* 动态插画区域 */}
      <div className="relative mb-8 h-48 w-48">
        <svg
          className="h-full w-full drop-shadow-xl"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 定义渐变 */}
          <defs>
            <linearGradient id="gradient-body" x1="100" y1="40" x2="100" y2="160" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="currentColor" className="text-muted-foreground/20" />
              <stop offset="1" stopColor="currentColor" className="text-muted-foreground/10" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 背景光晕 */}
          <circle
            cx="100"
            cy="100"
            r="60"
            className="fill-destructive/5 animate-pulse"
            style={{ animationDuration: "3s" }}
          />

          {/* 悬浮的机器人主体 - 组合动画 */}
          <g style={{ animation: "float 6s ease-in-out infinite" }}>
            {/* 身体 */}
            <rect
              x="60"
              y="70"
              width="80"
              height="70"
              rx="16"
              fill="url(#gradient-body)"
              stroke="currentColor"
              strokeWidth="2"
              className="text-muted-foreground/30"
            />

            {/* 屏幕/脸部 */}
            <rect x="70" y="80" width="60" height="40" rx="8" fill="currentColor" className="text-background" />

            {/* 眼睛 (X X) */}
            <g className="text-destructive">
              <path d="M85 95 L95 105 M95 95 L85 105" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <path
                d="M105 95 L115 105 M115 95 L105 105"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>

            {/* 嘴巴 (波浪线) */}
            <path
              d="M85 113 Q 100 110 115 113"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-muted-foreground/50"
            />

            {/* 天线 */}
            <path d="M100 70 L100 50" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/30" />
            <circle
              cx="100"
              cy="45"
              r="4"
              fill="currentColor"
              className="text-destructive animate-ping"
              style={{ animationDuration: "2s" }}
            />
            <circle cx="100" cy="45" r="4" fill="currentColor" className="text-destructive" />

            {/* 信号波纹 */}
            <path
              d="M85 35 Q 100 25 115 35"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-destructive/40"
              style={{ animation: "signal 2s infinite", opacity: 0 }}
            />
            <path
              d="M75 25 Q 100 10 125 25"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-destructive/20"
              style={{ animation: "signal 2s infinite 0.3s", opacity: 0 }}
            />
          </g>

          {/* 漂浮的碎片/装饰 */}
          <g className="text-destructive/30">
            <circle
              cx="40"
              cy="60"
              r="3"
              fill="currentColor"
              style={{ animation: "float 4s ease-in-out infinite 1s" }}
            />
            <rect
              x="160"
              y="140"
              width="6"
              height="6"
              rx="1"
              fill="currentColor"
              style={{ animation: "float 5s ease-in-out infinite 2s" }}
            />
            <path
              d="M150 50 L160 60 M160 50 L150 60"
              stroke="currentColor"
              strokeWidth="2"
              style={{ animation: "float 7s ease-in-out infinite 0.5s" }}
            />
          </g>
        </svg>

        {/* 阴影底座 */}
        <div className="absolute bottom-4 left-1/2 h-3 w-24 -translate-x-1/2 rounded-[100%] bg-black/5 blur-sm dark:bg-white/5" />
      </div>

      {/* 文本内容 */}
      <div className="max-w-[320px] space-y-3">
        <h3 className="text-xl font-semibold tracking-tight text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed text-balance">{message}</p>
      </div>

      {/* 操作按钮 */}
      {onRetry && (
        <div className="mt-8">
          <Button
            variant="outline"
            onClick={onRetry}
            size="lg"
            className="group gap-2.5 border-destructive/20 bg-background/50 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/40 transition-all shadow-sm hover:shadow-md"
          >
            <RefreshCcw className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180" />
            {retryText}
          </Button>
        </div>
      )}

      {/* 内联样式用于关键帧动画 */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes signal {
          0% { opacity: 0; transform: translateY(5px) scale(0.9); }
          50% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-5px) scale(1.1); }
        }
      `}</style>
    </div>
  );
}
