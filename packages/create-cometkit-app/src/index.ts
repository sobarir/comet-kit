/**
 * create-cometkit-app — scaffold a CometKit project.
 *
 * Steps: doctor → template → personalize (.env) → PostgreSQL 17+ check →
 * install → migrate+seed → workflow skills (Comet + grill-me +
 * UI UX Pro Max, for Claude Code AND Google Antigravity) → git init.
 *
 * Every external step degrades gracefully: on failure it prints the exact
 * manual command and continues, so a flaky network never leaves a
 * half-broken project without instructions.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import pc from "picocolors";
import postgres from "postgres";
import prompts from "prompts";
import * as tar from "tar";

const DEFAULT_REPO = "sobarir/comet-kit";
const DEFAULT_REF = "main";
const MIN_PG_MAJOR = 17;
const MIN_NODE_MAJOR = 20;

// Paths never copied from the template into a new project.
const TEMPLATE_EXCLUDES = [
  "node_modules",
  ".git",
  ".turbo",
  ".next",
  "dist",
  "bun.lock",
  ".env",
  ".comet.yaml",
  "tsconfig.tsbuildinfo",
  join("packages", "create-cometkit-app"),
];

interface Options {
  name?: string;
  dbUrl?: string;
  template?: string;
  repo: string;
  ref: string;
  yes: boolean;
  skipInstall: boolean;
  skipDb: boolean;
  skipWorkflow: boolean;
  skipGit: boolean;
  allowOldPostgres: boolean;
}

interface ManualStep {
  what: string;
  command: string;
}

const manualSteps: ManualStep[] = [];

function log(msg: string) {
  console.log(msg);
}
function ok(msg: string) {
  log(`${pc.green("✓")} ${msg}`);
}
function warn(msg: string) {
  log(`${pc.yellow("!")} ${msg}`);
}
function fail(msg: string): never {
  log(`${pc.red("✗")} ${msg}`);
  process.exit(1);
}
function step(title: string) {
  log(`\n${pc.bold(pc.blue("▸"))} ${pc.bold(title)}`);
}
function deferred(what: string, command: string) {
  manualSteps.push({ what, command });
  warn(`${what} — run manually later:\n    ${pc.cyan(command)}`);
}

function parseArgs(argv: string[]): Options {
  const opts: Options = {
    repo: process.env.COMETKIT_REPO ?? DEFAULT_REPO,
    ref: process.env.COMETKIT_REF ?? DEFAULT_REF,
    yes: false,
    skipInstall: false,
    skipDb: false,
    skipWorkflow: false,
    skipGit: false,
    allowOldPostgres: false,
  };
  const args = [...argv];
  while (args.length > 0) {
    const arg = args.shift() as string;
    switch (arg) {
      case "--db-url":
        opts.dbUrl = args.shift();
        break;
      case "--template":
        opts.template = args.shift();
        break;
      case "--repo":
        opts.repo = args.shift() ?? opts.repo;
        break;
      case "--ref":
        opts.ref = args.shift() ?? opts.ref;
        break;
      case "--yes":
      case "-y":
        opts.yes = true;
        break;
      case "--skip-install":
        opts.skipInstall = true;
        break;
      case "--skip-db":
        opts.skipDb = true;
        break;
      case "--skip-workflow":
        opts.skipWorkflow = true;
        break;
      case "--skip-git":
        opts.skipGit = true;
        break;
      case "--allow-old-postgres":
        opts.allowOldPostgres = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;
      default:
        if (!arg.startsWith("-") && !opts.name) opts.name = arg;
    }
  }
  return opts;
}

function printHelp() {
  log(`
${pc.bold("create-cometkit-app")} — scaffold a CometKit project

Usage:
  ${pc.cyan("bunx create-cometkit-app <name> [options]")}

Options:
  --db-url <url>         PostgreSQL connection string
                         (default: postgres://postgres:postgres@localhost:5432/<name>_dev)
  --template <dir>       Use a local template directory instead of GitHub
  --repo <owner/repo>    GitHub repo to download (default: ${DEFAULT_REPO})
  --ref <ref>            Branch/tag to download (default: ${DEFAULT_REF})
  -y, --yes              Accept all defaults, no prompts
  --skip-install         Skip dependency installation
  --skip-db              Skip database checks, migrations, and seed
  --skip-workflow        Skip Comet / grill-me / UI UX Pro Max installation
  --skip-git             Skip git init
  --allow-old-postgres   Continue even if PostgreSQL < ${MIN_PG_MAJOR}
`);
}

function has(cmd: string, args: string[] = ["--version"]): string | null {
  const result = spawnSync(cmd, args, { encoding: "utf8", shell: process.platform === "win32" });
  if (result.status === 0) return (result.stdout || result.stderr).trim().split("\n")[0] ?? "";
  return null;
}

function run(cmd: string, args: string[], cwd: string): boolean {
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  return result.status === 0;
}

/**
 * git is a real executable on every platform (never a .cmd/.ps1 shim), so
 * it never needs a shell wrapper. Skipping the shell avoids a Windows bug
 * where cmd.exe re-splits multi-word array arguments (e.g. a commit
 * message) at whitespace, corrupting them into extra positional args.
 */
function runGit(args: string[], cwd: string): boolean {
  const result = spawnSync("git", args, { cwd, stdio: "inherit", shell: false });
  return result.status === 0;
}

/** Commit message via -F <tempfile> — immune to any shell-quoting issue. */
function gitCommit(cwd: string, message: string): boolean {
  const file = join(tmpdir(), `cometkit-commit-${Date.now()}.txt`);
  writeFileSync(file, message + "\n");
  try {
    return runGit(["-c", "user.name=create-cometkit-app", "-c", "user.email=cli@cometkit.dev", "commit", "-q", "-F", file], cwd);
  } finally {
    rmSync(file, { force: true });
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  log(pc.bold("\n☄ create-cometkit-app"));

  // ---- project name -------------------------------------------------------
  if (!opts.name && !opts.yes) {
    const answer = await prompts({
      type: "text",
      name: "name",
      message: "Project name",
      initial: "my-cometkit-app",
    });
    opts.name = answer.name as string | undefined;
  }
  if (!opts.name) fail("A project name is required. Usage: create-cometkit-app <name>");
  const name = opts.name.toLowerCase().replace(/[^a-z0-9-_]/g, "-");
  if (name !== opts.name) warn(`Project name normalized to "${name}"`);
  const target = resolve(process.cwd(), name);
  if (existsSync(target) && readdirSync(target).length > 0) {
    fail(`Directory ${name} already exists and is not empty.`);
  }
  const dbName = `${name.replace(/-/g, "_")}_dev`;
  const dbUrl = opts.dbUrl ?? `postgres://postgres:postgres@localhost:5432/${dbName}`;

  // ---- doctor --------------------------------------------------------------
  step("Doctor — checking prerequisites");
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  if (nodeMajor < MIN_NODE_MAJOR) fail(`Node ${MIN_NODE_MAJOR}+ required (found ${process.versions.node})`);
  ok(`node ${process.versions.node}`);

  const bunVersion = has("bun");
  const pm = bunVersion ? "bun" : "npm";
  if (bunVersion) ok(`bun ${bunVersion}`);
  else warn("bun not found — falling back to npm (install bun: https://bun.sh)");

  if (has("git")) ok("git");
  else if (!opts.skipGit) fail("git is required (or pass --skip-git)");

  const python = has("python3") ?? has("python");
  if (python) ok(`python (${python}) — needed by UI UX Pro Max search`);
  else warn("python3 not found — UI UX Pro Max's search scripts will not run until installed");

  if (process.platform === "win32") {
    warn("Windows: Comet's workflow scripts need a bash shell — use Git Bash");
  }

  // ---- template ------------------------------------------------------------
  step("Template");
  if (opts.template) {
    const src = resolve(opts.template);
    if (!existsSync(join(src, "turbo.json"))) fail(`--template ${src} does not look like a CometKit repo`);
    copyTemplate(src, target);
    ok(`Copied local template from ${src}`);
  } else {
    const url = `https://codeload.github.com/${opts.repo}/tar.gz/refs/heads/${opts.ref}`;
    log(`  downloading ${pc.cyan(url)}`);
    const tarball = join(tmpdir(), `cometkit-${Date.now()}.tar.gz`);
    const extracted = join(tmpdir(), `cometkit-${Date.now()}`);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      writeFileSync(tarball, Buffer.from(await response.arrayBuffer()));
      mkdirSync(extracted, { recursive: true });
      await tar.x({ file: tarball, cwd: extracted, strip: 1 });
      copyTemplate(extracted, target);
      ok(`Downloaded ${opts.repo}@${opts.ref}`);
    } catch (error) {
      fail(
        `Could not download template (${String(error)}).\n` +
          `  If the repo is private or offline, clone it and use --template <dir>.`,
      );
    } finally {
      rmSync(tarball, { force: true });
      rmSync(extracted, { recursive: true, force: true });
    }
  }

  // ---- personalize ---------------------------------------------------------
  step("Personalize");
  const rootPkgPath = join(target, "package.json");
  const rootPkg = JSON.parse(readFileSync(rootPkgPath, "utf8")) as { name: string };
  rootPkg.name = name;
  writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + "\n");
  const jwtSecret = randomBytes(32).toString("hex");
  writeFileSync(
    join(target, ".env"),
    [
      "# Generated by create-cometkit-app",
      `DATABASE_URL=${dbUrl}`,
      `JWT_SECRET=${jwtSecret}`,
      "JWT_EXPIRES_IN=15m",
      "PORT=3001",
      "CORS_ORIGIN=http://localhost:3000",
      "",
    ].join("\n"),
  );
  writeFileSync(join(target, "apps", "web", ".env.local"), "NEXT_PUBLIC_API_URL=http://localhost:3001\n");
  ok(`.env written (JWT secret generated, database ${pc.cyan(dbName)})`);

  // ---- database ------------------------------------------------------------
  if (!opts.skipDb) {
    step(`PostgreSQL — checking ${dbUrl.replace(/:[^:@/]+@/, ":***@")}`);
    await checkAndCreateDatabase(dbUrl, opts.allowOldPostgres);
  }

  // ---- install -------------------------------------------------------------
  if (!opts.skipInstall) {
    step(`Installing dependencies (${pm})`);
    if (run(pm, ["install"], target)) ok("Dependencies installed");
    else deferred("Dependency install failed", `cd ${name} && ${pm} install`);
  }

  // ---- migrate + seed ------------------------------------------------------
  if (!opts.skipDb && !opts.skipInstall) {
    step("Database — migrate, then seed (order matters)");
    if (run(pm, ["run", "db:migrate"], target)) ok("Migrations applied");
    else deferred("Migration failed", `cd ${name} && ${pm} run db:migrate`);
    if (run(pm, ["run", "db:seed"], target)) ok("Seeded (admin@cometkit.dev / demo@cometkit.dev, password123)");
    else deferred("Seed failed", `cd ${name} && ${pm} run db:seed`);
  }

  // ---- workflow skills ------------------------------------------------------
  if (!opts.skipWorkflow) {
    step("Agent workflow — Comet + grill-me + UI UX Pro Max (Claude Code & Antigravity)");
    // Pre-create both platform dirs so installers detect both targets.
    mkdirSync(join(target, ".claude", "skills"), { recursive: true });
    mkdirSync(join(target, ".agents", "skills"), { recursive: true });

    // OpenSpec CLI is a hard dependency of the Open/Archive phases.
    const globalInstall = pm === "bun" ? ["add", "-g"] : ["install", "-g"];
    if (run(pm, [...globalInstall, "@fission-ai/openspec@latest"], target)) {
      ok("OpenSpec CLI installed globally");
    } else {
      deferred("OpenSpec CLI install failed", `npm install -g @fission-ai/openspec@latest`);
    }

    if (run("npx", ["-y", "@rpamis/comet@latest", "init", "--yes", "--scope", "project", "--language", "en"], target)) {
      ok("Comet workflow installed (OpenSpec + Superpowers + Comet skills)");
    } else {
      deferred("Comet install failed", `cd ${name} && npx @rpamis/comet@latest init --yes --scope project`);
    }

    if (
      run(
        "npx",
        // NOTE: the skills CLI takes repeated -s/-a flags, not comma lists.
        ["-y", "skills@latest", "add", "mattpocock/skills", "-s", "grill-me", "-s", "grilling", "-a", "claude-code", "-a", "antigravity", "-y", "--copy"],
        target,
      )
    ) {
      ok("grill-me installed (both platforms)");
    } else {
      deferred(
        "grill-me install failed",
        `cd ${name} && npx skills@latest add mattpocock/skills -s grill-me -s grilling -a claude-code -a antigravity -y --copy`,
      );
    }

    for (const ai of ["claude", "antigravity"]) {
      if (run("npx", ["-y", "ui-ux-pro-max-cli@latest", "init", "--ai", ai], target)) {
        ok(`UI UX Pro Max installed (${ai})`);
      } else {
        deferred(`UI UX Pro Max (${ai}) install failed`, `cd ${name} && npx ui-ux-pro-max-cli@latest init --ai ${ai}`);
      }
    }

    mirrorSkills(target);
  }

  // ---- git -------------------------------------------------------------------
  if (!opts.skipGit) {
    step("Git");
    const initialized =
      runGit(["init", "-b", "main"], target) &&
      // Repo-local only (doesn't touch the user's global git config).
      // Skill files are downloaded with mixed line endings; without this,
      // Windows' default autocrlf=true prints a CRLF warning per file on
      // every `git add`. .gitattributes (in the template) does the real
      // normalization work; this just silences the noise around it.
      runGit(["config", "core.autocrlf", "false"], target) &&
      runGit(["add", "-A"], target) &&
      gitCommit(target, "Initial commit from create-cometkit-app");
    if (initialized) ok("Repository initialized with initial commit");
    else deferred("git init failed", `cd ${name} && git init && git add -A && git commit -m "init"`);
  }

  // ---- summary ---------------------------------------------------------------
  log(`\n${pc.bold(pc.green("☄ Done."))} Created ${pc.cyan(name)}\n`);
  if (manualSteps.length > 0) {
    log(pc.bold(pc.yellow("Finish these manually:")));
    for (const item of manualSteps) log(`  • ${item.what}:\n    ${pc.cyan(item.command)}`);
    log("");
  }
  log(pc.bold("Next steps:"));
  log(`  cd ${name}`);
  log(`  ${pm} run dev          ${pc.dim("# API :3001, web :3000")}`);
  log(`  ${pc.dim("open Claude Code or Antigravity, then:")}`);
  log(`  /comet "your first feature idea"`);
  log(`\n  ${pc.dim("Rules live in AGENTS.md · recipe in docs/FEATURE_PATTERN.md · gate: ")}${pm} run verify\n`);
}

function copyTemplate(src: string, dest: string) {
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, {
    recursive: true,
    filter: (source) => {
      const rel = source.slice(src.length).replace(/^[/\\]/, "");
      if (rel === "") return true;
      return !TEMPLATE_EXCLUDES.some(
        (excluded) => rel === excluded || rel.startsWith(excluded + "/") || rel.startsWith(excluded + "\\") || rel.endsWith(".zip"),
      );
    },
  });
}

async function checkAndCreateDatabase(dbUrl: string, allowOld: boolean) {
  const url = new URL(dbUrl);
  const dbName = url.pathname.replace(/^\//, "");
  const adminUrl = new URL(dbUrl);
  adminUrl.pathname = "/postgres";

  const admin = postgres(adminUrl.toString(), {
    max: 1,
    connect_timeout: 5,
    // Server NOTICEs (e.g. collation-version warnings after an OS libc
    // update) are informational, not errors — don't dump them to the
    // console mid-scaffold. Real failures still throw and are caught below.
    onnotice: () => undefined,
  });
  try {
    const rows = await admin.unsafe<{ server_version: string }[]>("SHOW server_version");
    const version = rows[0]?.server_version ?? "0";
    const major = Number(version.split(".")[0]);
    if (major < MIN_PG_MAJOR) {
      const message = `PostgreSQL ${MIN_PG_MAJOR}+ required — server reports ${version}`;
      if (allowOld) warn(`${message} (continuing: --allow-old-postgres)`);
      else {
        await admin.end();
        fail(`${message}.\n  Upgrade PostgreSQL, or pass --allow-old-postgres to continue anyway.`);
      }
    } else {
      ok(`PostgreSQL ${version}`);
    }
    const exists = await admin`SELECT 1 FROM pg_database WHERE datname = ${dbName}`;
    if (exists.length === 0) {
      await admin.unsafe(`CREATE DATABASE "${dbName}"`);
      ok(`Created database ${dbName}`);
    } else {
      ok(`Database ${dbName} exists`);
    }
  } catch (error: unknown) {
    await admin.end().catch(() => undefined);
    diagnosePgError(error, dbUrl);
  }
  await admin.end().catch(() => undefined);
}

function diagnosePgError(error: unknown, dbUrl: string): never {
  const err = error as { code?: string; message?: string };
  const host = new URL(dbUrl).host;
  if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND" || err.code === "CONNECT_TIMEOUT") {
    fail(
      `Cannot reach PostgreSQL at ${host}.\n` +
        `  Is the server running? Start it, or pass --db-url for a different host, or --skip-db.`,
    );
  }
  if (err.code === "28P01" || err.code === "28000") {
    fail(`PostgreSQL rejected the credentials for ${host}.\n  Fix the user/password in --db-url.`);
  }
  fail(`PostgreSQL error: ${err.message ?? String(error)}`);
}

/** Ensure every skill exists on both platforms (same SKILL.md format). */
function mirrorSkills(target: string) {
  const claude = join(target, ".claude", "skills");
  const agents = join(target, ".agents", "skills");
  let mirrored = 0;
  for (const [from, to] of [
    [claude, agents],
    [agents, claude],
  ] as const) {
    if (!existsSync(from)) continue;
    for (const entry of readdirSync(from, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const destination = join(to, entry.name);
      if (!existsSync(destination)) {
        cpSync(join(from, entry.name), destination, { recursive: true });
        mirrored += 1;
      }
    }
  }
  if (mirrored > 0) ok(`Mirrored ${mirrored} skill(s) so Claude Code and Antigravity match`);
  else ok("Claude Code and Antigravity skill directories are in sync");
}

// execFileSync imported for potential future use in doctor extensions
void execFileSync;

main().catch((error) => {
  fail(String(error));
});
