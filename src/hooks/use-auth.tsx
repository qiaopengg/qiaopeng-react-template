import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { storageSymbol } from "@/constants/storage";
import { urlLoginApi } from "@/service/home";

interface User {
  id: string;
  name: string;
  account: string;
  email?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isUrlTokenProcessing: boolean;
  isUrlTokenChecked: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUrlTokenProcessing, setIsUrlTokenProcessing] = useState(false);
  const [isUrlTokenChecked, setIsUrlTokenChecked] = useState(false);

  // 集成 URL token 登录逻辑
  useEffect(() => {
    const initializeAuth = async () => {
      // 首先检查会话存储（未勾选“记住我”的场景），其次检查本地存储
      const storedUser = sessionStorage.getItem(storageSymbol.user) ?? localStorage.getItem(storageSymbol.user);
      const storedToken = sessionStorage.getItem(storageSymbol.token) ?? localStorage.getItem(storageSymbol.token);

      if (storedUser && storedToken) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsUrlTokenChecked(true);
          setIsLoading(false);
          // return;
        } catch (error) {
          console.error("解析用户数据失败:", error);
          sessionStorage.removeItem(storageSymbol.user);
          localStorage.removeItem(storageSymbol.user);
        }
      } else if (storedUser && !storedToken) {
        sessionStorage.removeItem(storageSymbol.user);
        localStorage.removeItem(storageSymbol.user);
      }

      // 如果没有本地用户数据，检查 URL token
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get("token");
      const userId = urlParams.get("userId");

      if (urlToken && userId) {
        setIsUrlTokenProcessing(true);
        console.log("🔍 检测到 URL token，开始处理");

        // 从 URL 中移除 token 参数
        urlParams.delete("token");
        urlParams.delete("userId");
        const newUrl = window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : "");
        window.history.replaceState({}, "", newUrl);

        try {
          console.log("🔑 开始验证 URL token");
          const userInfo = await urlLoginApi(urlToken, userId);
          const userData = {
            id: userInfo.UserInfo.F_UserId,
            name: userInfo.UserInfo.F_Account,
            account: userInfo.UserInfo.F_Account,
            avatar: "https://github.com/shadcn.png"
          };

          setUser(userData);
          localStorage.setItem(storageSymbol.user, JSON.stringify(userData));
          localStorage.setItem(storageSymbol.token, urlToken);
          console.log("✅ URL token 登录成功");
        } catch (error) {
          console.error("❌ Token验证失败:", error);
          sessionStorage.removeItem(storageSymbol.token);
          localStorage.removeItem(storageSymbol.token);
        } finally {
          setIsUrlTokenProcessing(false);
          setIsUrlTokenChecked(true);
          console.log("🏁 URL token 处理完成");
        }
      } else {
        setIsUrlTokenChecked(true);
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    const hasSessionToken = !!sessionStorage.getItem(storageSymbol.token);
    const storage = hasSessionToken ? sessionStorage : localStorage;
    storage.setItem(storageSymbol.user, JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    // 清除 sessionStorage/localStorage 中的用户数据和 token
    sessionStorage.removeItem(storageSymbol.user);
    sessionStorage.removeItem(storageSymbol.token);
    localStorage.removeItem(storageSymbol.user);
    localStorage.removeItem(storageSymbol.token);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        isUrlTokenProcessing,
        isUrlTokenChecked,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
