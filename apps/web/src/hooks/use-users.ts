"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateUserInput,
  Paginated,
  UpdateUserInput,
  UserDto,
} from "@cometkit/shared";
import { api } from "@/lib/api";

/**
 * Query-key convention: [resource, params]. Mutations invalidate the
 * resource root so every page of the list refetches.
 */
export const usersKeys = {
  all: ["users"] as const,
  list: (page: number, limit: number) => ["users", { page, limit }] as const,
};

export function useUsers(page: number, limit = 10) {
  return useQuery<Paginated<UserDto>>({
    queryKey: usersKeys.list(page, limit),
    queryFn: () =>
      api
        .get("users", { searchParams: { page, limit } })
        .json<Paginated<UserDto>>(),
    placeholderData: (previous) => previous,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) =>
      api.post("users", { json: input }).json<UserDto>(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: usersKeys.all }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateUserInput & { id: string }) =>
      api.patch(`users/${id}`, { json: input }).json<UserDto>(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: usersKeys.all }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`users/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: usersKeys.all }),
  });
}
