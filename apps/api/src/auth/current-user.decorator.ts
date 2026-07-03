import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthUser } from "@cometkit/shared";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return request.user;
  },
);
