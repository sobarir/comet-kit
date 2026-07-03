import { describe, expect, it } from "vitest";
import type { AuthUser } from "@cometkit/shared";
import type { User } from "@cometkit/db";
import { buildPageMeta, canDeleteUser, toUserDto } from "./users.policy";

const admin: AuthUser = {
  id: "01JX0000000000000000000001",
  email: "admin@cometkit.dev",
  name: "Admin",
  role: "admin",
};

describe("canDeleteUser", () => {
  it("allows deleting another user", () => {
    expect(canDeleteUser(admin, "01JX0000000000000000000002")).toBe(true);
  });

  it("forbids deleting yourself", () => {
    expect(canDeleteUser(admin, admin.id)).toBe(false);
  });
});

describe("toUserDto", () => {
  it("maps fields and never leaks passwordHash", () => {
    const row: User = {
      id: admin.id,
      email: admin.email,
      passwordHash: "hash",
      name: "Admin",
      role: "admin",
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    };
    const dto = toUserDto(row);
    expect(dto).toEqual({
      id: admin.id,
      email: admin.email,
      name: "Admin",
      role: "admin",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    expect("passwordHash" in dto).toBe(false);
  });
});

describe("buildPageMeta", () => {
  it("computes total pages", () => {
    expect(buildPageMeta(2, 20, 45)).toEqual({
      page: 2,
      limit: 20,
      total: 45,
      totalPages: 3,
    });
  });

  it("never reports zero pages", () => {
    expect(buildPageMeta(1, 20, 0).totalPages).toBe(1);
  });
});
