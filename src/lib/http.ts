import type { AxiosResponse, CreateAxiosDefaults, InternalAxiosRequestConfig } from "axios";
import axios from "axios";
import { env } from "@/config/env";
import { storageSymbol } from "@/constants/storage";
import { notify } from "@/lib/toast";

// 扩展 axios 配置类型，添加自定义选项
declare module "axios" {
  export interface AxiosRequestConfig {
    skipDuplicateCheck?: boolean;
    duplicateCheckWindow?: number;
    enableRetry?: boolean;
    retryCount?: number;
    retryDelayBaseMs?: number;
    __retryAttempt?: number;
  }
}

// 请求去重 Map - 存储正在进行的请求及其时间戳
interface PendingRequest {
  controller: AbortController;
  timestamp: number;
}

const pendingRequests = new Map<string, PendingRequest>();

// 默认去重时间窗口（毫秒）
const DEFAULT_DUPLICATE_WINDOW = 500;

/**
 * 生成请求唯一标识
 * 基于请求方法、URL、参数和数据生成唯一key
 */
function generateRequestKey(config: InternalAxiosRequestConfig): string {
  const { method, url, params, data } = config;
  return [method, url, JSON.stringify(params), JSON.stringify(data)].join("&");
}

/**
 * 添加请求到 pending 队列
 * 智能去重：只在短时间窗口内取消重复请求，避免影响查询库重试机制（@qiaopeng/tanstack-query-plus）
 */
function addPendingRequest(config: InternalAxiosRequestConfig) {
  // 如果配置了跳过去重检查，直接返回
  if (config.skipDuplicateCheck) {
    return;
  }

  const requestKey = generateRequestKey(config);
  const now = Date.now();
  const duplicateWindow = config.duplicateCheckWindow ?? DEFAULT_DUPLICATE_WINDOW;

  // 检查是否存在相同的待处理请求
  if (pendingRequests.has(requestKey)) {
    const pending = pendingRequests.get(requestKey)!;
    const timeDiff = now - pending.timestamp;

    // 只有在时间窗口内的请求才被认为是重复请求
    if (timeDiff < duplicateWindow) {
      console.log(`[HTTP] 取消重复请求: ${config.method?.toUpperCase()} ${config.url} (间隔: ${timeDiff}ms)`);
      pending.controller.abort();
    } else {
      // 超过时间窗口，可能是重试请求，允许执行
      console.log(`[HTTP] 允许请求（可能是重试）: ${config.method?.toUpperCase()} ${config.url} (间隔: ${timeDiff}ms)`);
    }
  }

  // 创建新的 AbortController
  const controller = new AbortController();
  config.signal = controller.signal;
  pendingRequests.set(requestKey, { controller, timestamp: now });
}

/**
 * 从 pending 队列移除请求
 */
function removePendingRequest(config: InternalAxiosRequestConfig) {
  const requestKey = generateRequestKey(config);
  pendingRequests.delete(requestKey);
}

const config: CreateAxiosDefaults = {
  baseURL: env.VITE_APP_API_IP, // 使用验证后的环境变量
  timeout: 15 * 1000,
  timeoutErrorMessage: "请求超时，请检查网络环境"
};

const http = axios.create(config);

const netCode = {
  notAuth: 10401
};

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem(storageSymbol.token) ?? localStorage.getItem(storageSymbol.token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 请求去重 - 自动取消重复请求
    addPendingRequest(config);

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function defaultResponse<T = any>(
  response: AxiosResponse<{ code: number; data: T; msg: string; success?: boolean }, any>
): Promise<T> {
  const res = response.data;
  const status = res.code;

  if (status && status !== 0) {
    if (status === netCode.notAuth) {
      sessionStorage.removeItem(storageSymbol.user);
      sessionStorage.removeItem(storageSymbol.token);
      localStorage.removeItem(storageSymbol.user);
      localStorage.removeItem(storageSymbol.token);
      // 保存当前路径用于登录后返回
      const currentPath = window.location.pathname + window.location.search;
      if (currentPath !== "/login") {
        sessionStorage.setItem("redirectAfterLogin", currentPath);
      }
      // 使用 window.location.replace 避免在历史记录中留下记录
      window.location.replace("/login");
      notify.error("登录已过期，请重新登录");
      return Promise.reject(response || "error");
    }
    const errInfo = `${res.code}:${response.config.url} \n ${res.msg}`;
    notify.error(res.msg || "请求失败");
    console.warn(errInfo);
    return Promise.reject(response || "error");
  } else {
    return Promise.resolve(res.data);
  }
}

// 响应拦截器
http.interceptors.response.use(
  (response) => {
    // 移除 pending 请求
    removePendingRequest(response.config as InternalAxiosRequestConfig);

    // 如果是 blob 类型的响应，直接返回原始响应数据
    if (response.config.responseType === "blob") {
      return response.data;
    }

    return defaultResponse(response);
  },
  (error) => {
    // 移除 pending 请求
    if (error?.config) {
      removePendingRequest(error.config as InternalAxiosRequestConfig);
    }

    // 检查错误是否由请求取消引起
    if (axios.isCancel(error)) {
      console.log("Request canceled:", error.message);
      return Promise.reject(error);
    }

    // 类型守卫：确保是 AxiosError
    if (!axios.isAxiosError(error)) {
      notify.error("未知错误");
      return Promise.reject(error);
    }

    const cfg = error.config as InternalAxiosRequestConfig | undefined;
    const shouldRetry = () => {
      if (!cfg) return false;
      const enableRetry = cfg.enableRetry ?? false;
      if (!enableRetry) return false;
      const attempt = cfg.__retryAttempt ?? 0;
      const max = cfg.retryCount ?? 2;
      if (attempt >= max) return false;
      if (!error.response) return true;
      const status = error.response.status;
      return status >= 500 && status < 600;
    };

    if (shouldRetry()) {
      const attempt = (cfg!.__retryAttempt ?? 0) + 1;
      cfg!.__retryAttempt = attempt;
      cfg!.skipDuplicateCheck = true;
      const base = cfg!.retryDelayBaseMs ?? 300;
      const delayMs = calculateBackoffDelay(attempt, base);
      return delay(delayMs).then(() => http.request(cfg!));
    }

    if (!error.response) {
      notify.error("网络连接失败，请检查网络");
      return Promise.reject(error);
    }

    // HTTP 状态码错误处理
    const status = error.response.status;
    switch (status) {
      case 401: {
        sessionStorage.removeItem(storageSymbol.user);
        sessionStorage.removeItem(storageSymbol.token);
        localStorage.removeItem(storageSymbol.user);
        localStorage.removeItem(storageSymbol.token);
        // 保存当前路径用于登录后返回
        const currentPath = window.location.pathname + window.location.search;
        if (currentPath !== "/login") {
          sessionStorage.setItem("redirectAfterLogin", currentPath);
        }
        // 使用 window.location.replace 避免在历史记录中留下记录
        window.location.replace("/login");
        notify.error("登录已过期，请重新登录");
        break;
      }
      case 403:
        notify.error("没有权限访问");
        break;
      case 404:
        notify.error("请求的资源不存在");
        break;
      case 500:
        notify.error("服务器错误");
        break;
      default:
        notify.error(error.message || "请求失败");
    }

    return Promise.reject(error);
  }
);

/**
 * 取消所有正在进行的请求
 * 使用场景：路由切换、用户登出等
 */
export function cancelAllRequests() {
  pendingRequests.forEach((pending) => {
    pending.controller.abort();
  });
  pendingRequests.clear();
}

/**
 * 取消特定请求
 * @param config 请求配置
 */
export function cancelRequest(config: InternalAxiosRequestConfig) {
  const requestKey = generateRequestKey(config);
  const pending = pendingRequests.get(requestKey);
  if (pending) {
    pending.controller.abort();
    pendingRequests.delete(requestKey);
  }
}

/**
 * 获取当前正在进行的请求数量
 */
export function getPendingRequestCount(): number {
  return pendingRequests.size;
}

export function calculateBackoffDelay(attempt: number, baseMs = 300): number {
  const expo = (2 ** attempt - 1) * baseMs;
  const jitter = Math.floor(Math.random() * baseMs);
  return expo + jitter;
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// 统一通过 AxiosInstance 的方法返回 Promise<T>，不再额外导出冗余的响应格式类型

// 重新声明 http 方法的返回类型
declare module "axios" {
  export interface AxiosInstance {
    get: <T = any>(url: string, config?: any) => Promise<T>;
    post: <T = any>(url: string, data?: any, config?: any) => Promise<T>;
    put: <T = any>(url: string, data?: any, config?: any) => Promise<T>;
    delete: <T = any>(url: string, config?: any) => Promise<T>;
  }
}

export { http };
