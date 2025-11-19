/**
 * 登录重定向逻辑 Hook
 * 职责：处理已登录用户的重定向
 */
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { storageSymbol } from "@/constants/storage";

export function useLoginRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem(storageSymbol.token) ?? localStorage.getItem(storageSymbol.token);
    const user = sessionStorage.getItem(storageSymbol.user) ?? localStorage.getItem(storageSymbol.user);

    if (token && user) {
      const redirectPath = sessionStorage.getItem("redirectAfterLogin");
      if (redirectPath) {
        sessionStorage.removeItem("redirectAfterLogin");
        navigate(redirectPath, { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [navigate]);
}
