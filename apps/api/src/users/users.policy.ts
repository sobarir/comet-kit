/**
 * Pure domain rules for user management - no I/O, fully unit-testable.
 * Services throw HTTP exceptions; policies just decide.
 */
import type { AuthUser, PageMeta, UserDto } from "@cometkit/shared";
import type { User } from "@cometkit/db";

/** Business rule: you cannot delete your own account. */
export function canDeleteUser(actor: AuthUser, targetId: string): boolean {
  return actor.id !== targetId;
}

/** Map a DB row to its wire shape. Never leak passwordHash. */
export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

export function buildPageMeta(
  page: number,
  limit: number,
  total: number,
): PageMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
