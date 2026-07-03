"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Health {
  status: string;
  timestamp: string;
}

export function HealthBadge() {
  const { data, isError, isPending } = useQuery<Health>({
    queryKey: ["health"],
    queryFn: () => api.get("health").json<Health>(),
    refetchInterval: 15_000,
    retry: 1,
  });

  const state = isPending ? "checking" : isError ? "offline" : data?.status;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 font-mono text-xs",
        state === "ok" && "text-foreground",
        state === "offline" && "text-destructive",
        state === "checking" && "text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          state === "ok" && "bg-emerald-500",
          state === "offline" && "bg-destructive",
          state === "checking" && "bg-muted-foreground",
        )}
      />
      api {state}
    </span>
  );
}
