import crypto from "crypto-js";
import { useState } from "react";
import { useNavigate, useRevalidator } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { storageSymbol } from "@/constants/storage";
import { useAuth } from "@/hooks/use-auth";
import { closeLoginDialog } from "@/hooks/use-login-dialog";
import { cn } from "@/lib/utils";
import { loginApi } from "@/service/home";

interface LoginResponse {
  Token: string;
  UserInfo: {
    F_UserId: string;
  };
}

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 模拟登录API调用
      const res: LoginResponse = await loginApi({ account, password: crypto.MD5(password).toString() });

      sessionStorage.setItem(storageSymbol.token, res.Token);

      // 创建用户对象并登录
      const user = {
        id: res.UserInfo.F_UserId,
        name: account,
        account,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(account)}&background=0D8ABC&color=fff`
      };

      login(user);
      closeLoginDialog();

      // 登录成功后跳转到项目配置页面
      navigate("/project-config/design-stage");

      // 登录成功后重新加载当前页面数据
      revalidator.revalidate();
    } catch (error) {
      console.error("登录失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>登录到您的账户</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="account">账号</Label>
                <Input
                  id="account"
                  type="account"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">密码</Label>
                  <a href="#" className="ml-auto inline-block text-sm underline-offset-4 hover:underline">
                    忘记密码？
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "登录中..." : "登录"}
                </Button>
              </div>
            </div>
            {/* <div className="mt-4 text-center text-sm">
              还没有账户？{" "}
              <a href="#" className="underline underline-offset-4">
                注册
              </a>
            </div> */}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
