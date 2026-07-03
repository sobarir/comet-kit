import ky from "ky";
import { getToken } from "./auth-storage";

/**
 * API client - single ky instance for the NestJS API.
 * Bearer token is attached from localStorage when present.
 * Reference pattern: swap to httpOnly cookies if your threat model needs it.
 */
export const api = ky.create({
  prefix: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const token = getToken();
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
      },
    ],
  },
});

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}

export async function readApiError(error: unknown): Promise<string> {
  if (error && typeof error === "object" && "response" in error) {
    try {
      const body = (await (
        error as { response: Response }
      ).response.json()) as ApiError;
      if (body.errors) {
        return Object.values(body.errors).flat().join(" ");
      }
      if (body.message) return body.message;
    } catch {
      // fall through to generic message
    }
  }
  return "Something went wrong. Check that the API is running and try again.";
}
