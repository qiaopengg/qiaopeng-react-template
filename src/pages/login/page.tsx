/**
 * 登录页面
 * 职责：页面布局和组件组装
 */
import { BrandSection, LoginForm, MobileLogo } from "./components";
import { useLoginRedirect } from "./hooks";

export default function LoginPage() {
  // 处理已登录用户的重定向
  useLoginRedirect();

  return (
    <div className="min-h-screen flex">
      {/* 左侧 - 品牌展示区 */}
      <BrandSection />

      {/* 右侧 - 登录表单区 */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* 移动端 Logo */}
          <MobileLogo />

          {/* 登录卡片 */}
          <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
            {/* 标题 */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">欢迎回来</h2>
              <p className="text-muted-foreground text-sm">请登录您的账户以继续</p>
            </div>

            {/* 登录表单 */}
            <LoginForm />

            {/* 分隔线 */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground">或</span>
              </div>
            </div>

            {/* 其他登录方式 */}
            <div className="text-center text-sm text-muted-foreground">
              <p>
                还没有账户？
                <a href="#" className="text-primary hover:opacity-90 font-medium ml-1">
                  联系管理员
                </a>
              </p>
            </div>
          </div>

          {/* 底部提示 */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            登录即表示您同意我们的
            <a href="#" className="text-primary hover:opacity-90 mx-1">
              服务条款
            </a>
            和
            <a href="#" className="text-primary hover:opacity-90 ml-1">
              隐私政策
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
