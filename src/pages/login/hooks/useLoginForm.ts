import type { LoginFormData, User } from "../types";
/**
 * 登录表单业务逻辑 Hook
 * 职责：表单状态管理、验证、提交逻辑
 */
import { useState } from "react";
import { useNavigate } from "react-router";
import { storageSymbol } from "@/constants/storage";
import { loginApi } from "../api";

export function useLoginForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginFormData>({
    account: "",
    password: "",
    remember: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 更新账号
  const updateAccount = (account: string) => {
    setFormData((prev) => ({ ...prev, account }));
    if (errorMsg) setErrorMsg("");
  };

  // 更新密码
  const updatePassword = (password: string) => {
    setFormData((prev) => ({ ...prev, password }));
    if (errorMsg) setErrorMsg("");
  };

  const updateRemember = (remember: boolean) => {
    setFormData((prev) => ({ ...prev, remember }));
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.account.trim() || !formData.password.trim()) {
      setErrorMsg("请输入账号和密码");
      return;
    }

    setIsLoading(true);

    try {
      const res = await loginApi(formData);

      const storage = formData.remember ? localStorage : sessionStorage;
      storage.setItem(storageSymbol.token, res.Token);

      const user: User = {
        id: res.UserInfo.F_UserId,
        name: res.UserInfo.F_Account || formData.account,
        account: formData.account,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.account)}&background=0D8ABC&color=fff`
      };

      storage.setItem(storageSymbol.user, JSON.stringify(user));

      setErrorMsg("");

      const redirectPath = sessionStorage.getItem("redirectAfterLogin");
      if (redirectPath) {
        sessionStorage.removeItem("redirectAfterLogin");
        navigate(redirectPath, { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error("登录失败:", error);
      setErrorMsg("登录失败，请检查账号密码");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    isLoading,
    errorMsg,
    updateAccount,
    updatePassword,
    updateRemember,
    handleSubmit
  };
}
