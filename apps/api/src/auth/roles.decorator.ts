import { SetMetadata } from "@nestjs/common";
import type { UserRole } from "@cometkit/shared";

export const ROLES_KEY = "roles";

/** Restrict a route to the given roles. Use together with JwtAuthGuard. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
