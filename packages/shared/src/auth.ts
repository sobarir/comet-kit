import { z } from "zod";
import type { UserRole } from "./constants";

export const registerSchema = z.object({
  email: z.email().max(255),
  password: z.string().min(8).max(72),
  name: z.string().min(1).max(120).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email().max(255),
  password: z.string().min(8).max(72),
});
export type LoginInput = z.infer<typeof loginSchema>;

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}
