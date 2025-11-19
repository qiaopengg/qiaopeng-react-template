import { useQueryClient } from "@qiaopeng/tanstack-query-plus";
import { useEffect, useMemo, useState } from "react";

interface UseIsMutatingOptions {
  mutationKey?: readonly unknown[];
}

export function useIsMutatingPlus(options?: UseIsMutatingOptions): number {
  const queryClient = useQueryClient();
  const [count, setCount] = useState(0);
  const keyJson = useMemo(() => JSON.stringify(options?.mutationKey ?? null), [options?.mutationKey]);
  const hasKey = useMemo(() => keyJson !== "null", [keyJson]);

  useEffect(() => {
    const cache: any = queryClient.getMutationCache();
    const update = () => {
      const all: any[] = cache.getAll();
      if (!hasKey) {
        setCount(all.length);
        return;
      }
      const filtered = all.filter((m) => {
        const mk = m?.options?.mutationKey;
        try {
          return JSON.stringify(mk) === keyJson;
        } catch {
          return false;
        }
      });
      setCount(filtered.length);
    };
    const unsubscribe = cache.subscribe(update);
    update();
    return () => unsubscribe?.();
  }, [queryClient, hasKey, keyJson]);

  return count;
}
