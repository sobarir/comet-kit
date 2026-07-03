"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type {
  AuthResponse,
  AuthUser,
  LoginInput,
  RegisterInput,
} from "@cometkit/shared";
import { api } from "@/lib/api";
import { clearToken, getToken, setToken } from "@/lib/auth-storage";

export function useMe() {
  return useQuery<AuthUser>({
    queryKey: ["me"],
    queryFn: () => api.get("auth/me").json<AuthUser>(),
    enabled: typeof window !== "undefined" && getToken() !== null,
    retry: false,
    staleTime: 60_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) =>
      api.post("auth/login", { json: input }).json<AuthResponse>(),
    onSuccess: (data) => {
      setToken(data.tokens.accessToken);
      queryClient.setQueryData(["me"], data.user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterInput) =>
      api.post("auth/register", { json: input }).json<AuthResponse>(),
    onSuccess: (data) => {
      setToken(data.tokens.accessToken);
      queryClient.setQueryData(["me"], data.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return () => {
    clearToken();
    queryClient.removeQueries({ queryKey: ["me"] });
    router.push("/login");
  };
}
