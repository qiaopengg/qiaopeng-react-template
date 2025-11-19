import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { storageSymbol } from "@/constants/storage";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function isLogin() {
  return !!(sessionStorage.getItem(storageSymbol.token) ?? localStorage.getItem(storageSymbol.token));
}

function pick<T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return Object.fromEntries(keys.filter((key) => key in obj).map((key) => [key, obj[key]])) as Pick<T, K>;
}

function delay<T>(func: Promise<T>, timeout = 3000): Promise<T> {
  const delayFunc = new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeout);
  });
  return Promise.all([func, delayFunc]).then((res) => res[0]);
}

function scrollToBottom(smooth = true) {
  try {
    const scrollHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );

    console.log("滚动调试信息:", {
      scrollHeight,
      currentPosition: window.pageYOffset,
      windowHeight: window.innerHeight
    });

    // 使用更可靠的滚动方法
    if (smooth) {
      window.scrollTo({
        top: scrollHeight,
        behavior: "smooth"
      });
    } else {
      window.scrollTo(0, scrollHeight);
    }

    console.log("滚动命令已执行");
  } catch (error) {
    console.error("滚动失败:", error);
  }
}

function scrollToBottomRef(ref: React.RefObject<HTMLElement | null>, smooth = true) {
  if (!ref.current) {
    console.error("ref容器未找到");
    return;
  }

  const element = ref.current;
  console.log("滚动ref容器:", element.scrollHeight, element.scrollTop);

  if (smooth) {
    element.scrollTo({
      top: element.scrollHeight,
      behavior: "smooth"
    });
  } else {
    element.scrollTop = element.scrollHeight;
  }
}

function generateUUID(): string {
  // 使用 crypto.randomUUID() 如果浏览器支持
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // 降级方案：生成 v4 UUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function deepCopy<T>(source: T): T {
  // 处理基本类型和null/undefined
  if (source === null || typeof source !== "object") {
    return source;
  }

  // 处理数组
  if (Array.isArray(source)) {
    const copy: unknown[] = [];
    for (let i = 0; i < source.length; i++) {
      copy[i] = deepCopy(source[i]);
    }
    return copy as T;
  }

  // 处理普通对象
  const copy: Record<string | symbol, unknown> = {};
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      copy[key] = deepCopy(source[key as keyof T]);
    }
  }

  return copy as T;
}

export { cn, deepCopy, delay, generateUUID, isLogin, pick, scrollToBottom, scrollToBottomRef };

// 表单通用工具函数
function splitToArray(input: unknown): string[] {
  if (input == null) {
    return [];
  }
  try {
    return String(input).split(",").filter(Boolean);
  } catch {
    return [];
  }
}

function joinIfArray(val: string | string[] | undefined): string {
  if (!val) {
    return "";
  }
  return Array.isArray(val) ? val.join(",") : val;
}

export { joinIfArray, splitToArray };
