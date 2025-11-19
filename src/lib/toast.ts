// utils/toast.ts
import { toast } from "sonner";

export const notify = {
  success: (msg: string) =>
    toast.success(msg, {
      style: {
        color: "#16a34a",
        border: "1px solid #15803d"
      }
    }),

  error: (msg: string) =>
    toast.error(msg, {
      style: {
        color: "#dc2626",
        border: "1px solid #b91c1c"
      }
    }),

  info: (msg: string) =>
    toast.info(msg, {
      style: {
        color: "#2563eb",
        border: "1px solid #1d4ed8"
      }
    })
};
