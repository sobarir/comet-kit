import { Reflector } from "@nestjs/core";
import type { ExecutionContext } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import type { AuthUser } from "@cometkit/shared";
import { RolesGuard } from "./roles.guard";
import { ROLES_KEY } from "./roles.decorator";

function contextWith(user: AuthUser | undefined, roles?: string[]) {
  class Dummy {}
  const handler = () => undefined;
  const reflector = new Reflector();
  if (roles) {
    Reflect.defineMetadata(ROLES_KEY, roles, handler);
  }
  const context = {
    getHandler: () => handler,
    getClass: () => Dummy,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
  return { guard: new RolesGuard(reflector), context };
}

const user: AuthUser = {
  id: "01JX0000000000000000000002",
  email: "demo@cometkit.dev",
  name: null,
  role: "user",
};

describe("RolesGuard", () => {
  it("allows routes without role metadata", () => {
    const { guard, context } = contextWith(user);
    expect(guard.canActivate(context)).toBe(true);
  });

  it("blocks a standard user from admin routes", () => {
    const { guard, context } = contextWith(user, ["admin"]);
    expect(guard.canActivate(context)).toBe(false);
  });

  it("allows an admin on admin routes", () => {
    const { guard, context } = contextWith({ ...user, role: "admin" }, ["admin"]);
    expect(guard.canActivate(context)).toBe(true);
  });
});
