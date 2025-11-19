import type { LoginFormData, LoginResponse } from "../types";
/**
 * 登录相关 API
 */
import crypto from "crypto-js";
import { http } from "@/lib/http";

/**
 * 用户登录
 */
export async function loginApi(data: LoginFormData): Promise<LoginResponse> {
  return http.post<LoginResponse>("/login", {
    account: data.account,
    password: crypto.MD5(data.password).toString()
  });
}

/**
 * URL Token 登录
 */
export async function urlLoginApi(token: string, userId: string): Promise<LoginResponse> {
  return http.post<LoginResponse>(`/api/token/sso-login?token=${token}&userId=${userId}`);
}
