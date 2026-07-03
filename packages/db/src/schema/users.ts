import { pgEnum, pgTable, varchar } from "drizzle-orm/pg-core";
import { USER_ROLES } from "@cometkit/shared";
import { timestamps, ulidPk } from "../columns";

/** Role enum derives from the shared USER_ROLES tuple - one source of truth. */
export const userRoleEnum = pgEnum("user_role", USER_ROLES);

export const users = pgTable("users", {
  id: ulidPk(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 120 }),
  role: userRoleEnum("role").notNull().default("user"),
  ...timestamps,
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
