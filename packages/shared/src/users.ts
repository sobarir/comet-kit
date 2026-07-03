import { z } from "zod";
import { USER_ROLES, type UserRole } from "./constants";

/** Wire shape for a user. Dates cross the wire as ISO strings. */
export interface UserDto {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: string;
}

export const createUserSchema = z.object({
  email: z.email().max(255),
  password: z.string().min(8).max(72),
  name: z.string().min(1).max(120).optional(),
  role: z.enum(USER_ROLES).default("user"),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z
  .object({
    name: z.string().min(1).max(120).nullable().optional(),
    role: z.enum(USER_ROLES).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  });
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(120),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
