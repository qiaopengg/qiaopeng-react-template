/**
 * 登录表单组件
 * 职责：表单 UI 渲染
 */
import { AlertCircle, Eye, EyeOff, Lock, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLoginForm } from "../hooks";

export function LoginForm() {
  const { formData, isLoading, errorMsg, updateAccount, updatePassword, updateRemember, handleSubmit } = useLoginForm();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 账号输入 */}
      <div className="space-y-2">
        <label htmlFor="account" className="text-sm font-medium text-muted-foreground block">
          账号
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            id="account"
            type="text"
            value={formData.account}
            onChange={(e) => updateAccount(e.target.value)}
            placeholder="请输入账号"
            className="pl-10 h-12 border-border focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[1px]"
            disabled={isLoading}
            required
          />
        </div>
      </div>

      {/* 密码输入 */}
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-muted-foreground block">
          密码
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => updatePassword(e.target.value)}
            placeholder="请输入密码"
            className="pl-10 pr-10 h-12 border-border focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[1px]"
            disabled={isLoading}
            required
          />
          <button
            type="button"
            aria-label={showPassword ? "隐藏密码" : "显示密码"}
            onClick={() => setShowPassword((v) => !v)}
            disabled={isLoading}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* 记住我和忘记密码 */}
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 text-primary border-border rounded focus:ring-ring/50"
            checked={formData.remember}
            onChange={(e) => updateRemember(e.target.checked)}
          />
          <span className="text-muted-foreground">记住我</span>
        </label>
        <a href="#" className="text-primary hover:opacity-90 font-medium">
          忘记密码？
        </a>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-md border border-destructive bg-destructive/10 text-destructive px-3 py-2">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{errorMsg}</span>
        </div>
      )}

      {/* 登录按钮 */}
      <Button
        type="submit"
        className="w-full h-12 bg-primary hover:opacity-90 text-primary-foreground font-medium rounded-lg transition-colors"
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>登录中...</span>
          </div>
        ) : (
          "登录"
        )}
      </Button>
    </form>
  );
}
