/**
 * Seed script - run AFTER `db:migrate`. Order matters: migrate, then seed.
 * Idempotent: re-running updates the demo accounts in place.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as bcrypt from "bcryptjs";
import { ulid } from "ulid";
import { databaseUrl } from "../env";
import * as schema from "./schema";

const DEMO_ACCOUNTS = [
  { email: "admin@cometkit.dev", name: "Demo Admin", role: "admin" as const },
  { email: "demo@cometkit.dev", name: "Demo User", role: "user" as const },
];

async function main() {
  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client, { schema });

  const passwordHash = await bcrypt.hash("password123", 10);

  for (const account of DEMO_ACCOUNTS) {
    await db
      .insert(schema.users)
      .values({ id: ulid(), passwordHash, ...account })
      .onConflictDoUpdate({
        target: schema.users.email,
        set: { passwordHash, name: account.name, role: account.role },
      });
  }

  console.log(
    "Seed complete: admin@cometkit.dev (admin), demo@cometkit.dev (user) / password123",
  );
  await client.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
