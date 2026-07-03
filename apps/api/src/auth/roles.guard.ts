import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { AuthUser, UserRole } from "@cometkit/shared";
import { ROLES_KEY } from "./roles.decorator";

/**
 * Enforces @Roles(...) metadata. Runs after JwtAuthGuard, which attaches
 * the fresh user (including role) to the request.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;

    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: AuthUser }>();
    return user !== undefined && required.includes(user.role);
  }
}
