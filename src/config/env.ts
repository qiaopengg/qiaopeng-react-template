import { z } from "zod";

/**
 * 环境变量验证 Schema
 * 确保所有必需的环境变量都存在且格式正确
 */
const envSchema = z.object({
  VITE_APP_API_IP: z
    .string()
    .min(1, "API 地址不能为空")
    .refine(
      (val) => {
        try {
          const u = new URL(val);
          return typeof u.href === "string" && u.href.length > 0;
        } catch {
          return false;
        }
      },
      { message: "API 地址必须是有效的 URL" }
    )
    .refine((val) => !val.includes("https://https://") && !val.includes("http://http://"), {
      message: "API 地址包含重复的协议前缀"
    })
});

/**
 * 验证并导出环境变量
 * 如果验证失败，会在应用启动时立即抛出错误
 */
function validateEnv() {
  try {
    const parsed = envSchema.parse({
      VITE_APP_API_IP: import.meta.env.VITE_APP_API_IP
    });
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues ?? [];
      const errorMessages = issues.map((err) => `  - ${err.path.join(".")}: ${err.message}`).join("\n");

      console.error(`❌ 环境变量验证失败:\n${errorMessages}\n\n请检查 .env 文件配置`);

      if (import.meta.env.DEV) {
        console.error(
          `环境变量配置错误！\n\n${issues.map((err) => `${err.path.join(".")}: ${err.message}`).join("\n")}\n\n请检查 .env 文件配置`
        );
      }
    }
    throw error;
  }
}

/**
 * 导出验证后的环境变量
 * 使用示例:
 * import { env } from '@/config/env';
 * const baseURL = env.VITE_APP_API_IP;
 */
export const env = validateEnv();

/**
 * 类型安全的环境变量类型
 */
export type Env = z.infer<typeof envSchema>;
