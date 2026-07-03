/**
 * Integration spec - exercises UsersService against the real database.
 * Requires DATABASE_URL (repo-root .env). Run with: bun run test:int
 */
import { ForbiddenException } from "@nestjs/common";
import { config } from "dotenv";
import { resolve } from "node:path";
import { ulid } from "ulid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb, users, type Database } from "@cometkit/db";
import { eq, inArray } from "drizzle-orm";
import type { AuthUser } from "@cometkit/shared";
import { UsersService } from "./users.service";

config({ path: resolve(__dirname, "../../../../.env") });

const noopLogger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
} as never;

describe("UsersService (integration)", () => {
  let db: Database;
  let service: UsersService;
  const createdIds: string[] = [];
  const suffix = ulid().toLowerCase();

  beforeAll(() => {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL required for integration tests");
    db = createDb(url);
    service = new UsersService(db, noopLogger);
  });

  afterAll(async () => {
    if (createdIds.length > 0) {
      await db.delete(users).where(inArray(users.id, createdIds));
    }
  });

  it("creates, lists, updates role, and refuses self-delete", async () => {
    const created = await service.createUser({
      email: `int-${suffix}@cometkit.dev`,
      password: "password123",
      role: "user",
    });
    createdIds.push(created.id);
    expect(created.id).toHaveLength(26);
    expect(created.role).toBe("user");

    const page = await service.list({ page: 1, limit: 100 });
    expect(page.data.some((u) => u.id === created.id)).toBe(true);
    expect(page.meta.total).toBeGreaterThanOrEqual(1);

    const promoted = await service.updateUser(created.id, { role: "admin" });
    expect(promoted.role).toBe("admin");

    const actor: AuthUser = {
      id: created.id,
      email: created.email,
      name: null,
      role: "admin",
    };
    await expect(service.deleteUser(actor, created.id)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    // row still present after refused delete
    const [row] = await db.select().from(users).where(eq(users.id, created.id));
    expect(row).toBeDefined();
  });
});
