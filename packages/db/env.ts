// Loads DATABASE_URL for drizzle-kit and the seed script,
// preferring the repo-root .env.
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const rootEnv = resolve(__dirname, "../../.env");
config({ path: existsSync(rootEnv) ? rootEnv : resolve(__dirname, ".env") });

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env at the repo root and point it at your local PostgreSQL 17+ instance.",
    );
  }
  return url;
}

export const databaseUrl: string = requireDatabaseUrl();
