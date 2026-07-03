import { char, timestamp } from "drizzle-orm/pg-core";
import { ulid } from "ulid";

/**
 * ULID primary key - CometKit's default for every table.
 *
 * Generated app-side via `$defaultFn`, so it works against any vanilla
 * PostgreSQL 17+ install with no extensions. ULIDs are time-ordered
 * (index-friendly inserts, sortable by creation time) and stored in
 * their canonical 26-char Crockford base32 form for debuggability.
 */
export const ulidPk = () =>
  char("id", { length: 26 })
    .primaryKey()
    .$defaultFn(() => ulid());

/** Foreign-key column matching the ULID primary key shape. */
export const ulidRef = (name: string) => char(name, { length: 26 });

/** Standard created/updated timestamps for all tables. */
export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};
