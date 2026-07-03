import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function createDb(url: string) {
  const client = postgres(url, {
    max: 10,
    // Server NOTICEs are informational (e.g. collation-version warnings
    // after an OS libc update) — don't dump them to stdout. Real errors
    // still throw and are handled by the app's own error paths.
    onnotice: () => undefined,
  });
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDb>;

export * from "./columns";
export * from "./schema";
export { schema };
