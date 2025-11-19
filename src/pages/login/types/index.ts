/**
 * 登录相关类型定义
 */

export interface LoginFormData {
  account: string;
  password: string;
  remember?: boolean;
}

export interface LoginResponse {
  Token: string;
  UserInfo: {
    F_UserId: string;
    F_Account: string;
  };
}

export interface User {
  id: string;
  name: string;
  account: string;
  avatar?: string;
}
