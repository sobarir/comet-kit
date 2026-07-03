# CometKit

An agentic-AI-first starter kit: a Turborepo monorepo scaffold paired with a
spec-driven development workflow (Comet = OpenSpec + Superpowers, grill-me,
UI UX Pro Max) so AI coding agents build features through a disciplined,
resumable pipeline — on **Claude Code** and **Google Antigravity** (IDE & CLI).

## Stack

All dependencies track `@latest` (Next 16, React 19, TypeScript 6, Zod 4,
Vitest 4, ESLint 10 at the time of writing).

- **Monorepo**: Turborepo + bun workspaces
- **API** (`apps/api`): NestJS on the Fastify adapter, Passport + JWT auth
  with roles (RBAC), pino logging with ULID request ids, uniform error
  envelope, Zod validation
- **Web** (`apps/web`): Next.js App Router, Tailwind v4 + shadcn-style UI,
  TanStack Query + ky API client, auth pages, dashboard, admin user management
- **Database** (`packages/db`): Drizzle ORM + drizzle-kit, postgres-js,
  **ULID primary keys** on every table (app-side generation, no extensions)
- **Shared** (`packages/shared`): the API contract — Zod schemas, DTOs,
  roles, error envelope — one source of truth for API and web
- **Scaffolder** (`packages/create-cometkit-app`): the CLI that creates new
  projects from this kit

## Prerequisites

| Requirement            | Why                                            |
| ---------------------- | ---------------------------------------------- |
| Node.js 20+ and bun    | Runtime & package manager                      |
| PostgreSQL **17+** running locally | The database (no Docker in this kit) |
| git                    | Version control; Superpowers uses branches     |
| Python 3.x             | UI UX Pro Max's design search engine           |
| Claude Code and/or Google Antigravity | The agents that do the building |
| Git Bash (Windows only)| Comet's workflow scripts need a bash shell     |

---

## Step 1 — Create a project

```bash
bunx create-cometkit-app my-app        # or: npx create-cometkit-app my-app
```

The scaffolder walks through, in order:

1. **Doctor** — verifies Node 20+, bun, git, Python 3; warns about Git Bash
   on Windows.
2. **Template** — downloads the kit (or use `--template <dir>` for a local
   copy).
3. **Personalize** — sets the project name, writes `.env` with a generated
   `JWT_SECRET` and `DATABASE_URL` (default
   `postgres://postgres:postgres@localhost:5432/<name>_dev`; override with
   `--db-url`).
4. **PostgreSQL check** — connects, requires server version 17+ (fails fast
   with the exact problem: unreachable vs bad credentials vs old version),
   and creates the database if missing.
5. **Install** — `bun install`.
6. **Migrate, then seed** — applies the shipped migrations and seeds two
   accounts: `admin@cometkit.dev` (admin) and `demo@cometkit.dev`
   (standard), both `password123`.
7. **Agent workflow** — installs the OpenSpec CLI, then Comet
   (OpenSpec + Superpowers + Comet skills), grill-me, and UI UX Pro Max —
   into **both** `.claude/skills/` and `.agents/skills/`, and mirrors any
   skill missing on one side.
8. **Git** — `git init` + initial commit.

If any network step fails, the scaffolder prints the exact manual command
and continues. Useful flags: `--skip-workflow`, `--skip-db`, `--yes`,
`--allow-old-postgres`, `--db-url <url>`. Health check any time:
`npx @rpamis/comet doctor`.

## Step 2 — Start the apps

```bash
cd my-app
bun run dev        # API on :3001, web on :3000
```

Open http://localhost:3000 and sign in with a seeded account.

## Step 3 — Build your first feature (the Comet workflow)

Open the project in Claude Code or Antigravity and type:

```
/comet "customers can leave reviews on orders"
```

What happens, phase by phase (your involvement in bold):

1. **Open** — a grilling interview stress-tests the idea one question at a
   time (each with a recommended answer — often you just say "yes").
   The OpenSpec proposal and task list are generated from that transcript.
   **You approve the proposal.**
2. **Design** — Superpowers brainstorming produces the technical design
   doc and implementation plan. **You review key decisions.**
3. **Build** — TDD execution (red-green-refactor), following
   `docs/FEATURE_PATTERN.md`: contract in `shared` → schema + migration in
   `db` → API module → web hooks + page. UI work triggers UI UX Pro Max.
   Tasks are checked off by script as they complete.
4. **Verify** — runs the gate (`bun run verify` = typecheck + lint + test)
   plus code review. **You see the verification report.**
5. **Archive** — the spec is synced and archived under
   `openspec/changes/archive/`; the branch is finished.

Shortcuts for small work: `/comet-hotfix` (skip brainstorming) and
`/comet-tweak` (skip brainstorming and the full plan).

## Step 4 — Pause and resume (days or weeks later)

State lives on disk, not in the chat — `.comet.yaml`, the task checkboxes
in `openspec/changes/`, and git. So:

- In the agent: type `/comet` (or ask "where are we now?" — the resume
  protocol in `AGENTS.md` reconstructs state from disk and reports the
  active change, phase, remaining tasks, and next command).
- In the terminal: `comet status` or `comet dashboard`.

This matters most in Antigravity, where sessions start fresh: the Comet
state machine is the memory.

## Step 5 — Day-to-day commands

| Command                | What it does                                  |
| ---------------------- | --------------------------------------------- |
| `bun run dev`          | Watch mode across the monorepo                |
| `bun run verify`       | THE gate: typecheck + lint + unit tests       |
| `bun run test:int` (in apps/api) | Integration tests against local Postgres |
| `bun run db:generate`  | Generate SQL migration after schema changes   |
| `bun run db:migrate`   | Apply migrations (always before seed)         |
| `bun run db:seed`      | Seed demo accounts                            |

---

## Reference API (what ships in the scaffold)

| Method | Path             | Access        | Notes                          |
| ------ | ---------------- | ------------- | ------------------------------ |
| POST   | `/auth/register` | public        | Returns user + JWT             |
| POST   | `/auth/login`    | public        | Returns user + JWT             |
| GET    | `/auth/me`       | signed in     | Fresh role on every request    |
| PATCH  | `/users/me`      | signed in     | Update own profile             |
| GET    | `/users`         | admin         | Paginated list                 |
| POST   | `/users`         | admin         | Create user with role          |
| PATCH  | `/users/:id`     | admin         | Update name/role               |
| DELETE | `/users/:id`     | admin         | 204; refuses self-delete       |
| GET    | `/health`        | public        | Liveness                       |

The auth + user-management modules are **reference code**: the worked
example every new feature copies structurally. Extend, don't rebuild.

## Agent platforms

The canonical agent guide is `AGENTS.md` — Claude Code imports it via
`CLAUDE.md`, Antigravity reads it natively. Skills live in both
`.claude/skills/` and `.agents/skills/` (same SKILL.md format).

## How features are built

Read `AGENTS.md` (agent rules: DRY boundaries, error envelope, logging,
testing, gotchas) and `docs/FEATURE_PATTERN.md` (the step-by-step vertical
slice recipe). The worked example is user management: contract in
`packages/shared/src/users.ts` → schema in `packages/db/src/schema/users.ts`
→ module in `apps/api/src/users` → UI in `apps/web/src/app/dashboard/users`.

## Working on the kit itself (manual setup)

```bash
createdb cometkit_dev
cp .env.example .env      # edit DATABASE_URL / JWT_SECRET
bun install
bun run db:migrate && bun run db:seed
bun run dev
```

## Conventions (summary — AGENTS.md is authoritative)

- **ULID primary keys**: `ulidPk()` for every table, `ulidRef()` for FKs;
  `char(26)`, app-side generation, time-ordered.
- **Timestamps**: spread `...timestamps` into every table.
- **Validation**: Zod schemas in `@cometkit/shared`, applied with
  `ZodValidationPipe`; the same types drive the web client.
- **Errors**: one envelope (`ApiErrorBody`), produced by the global
  exception filter, consumed by `readApiError`.
- **Logging**: pino; services log domain events (`user.created`) with ids,
  never secrets; ULID request-ids correlate everything.
- **UI**: shadcn-idiom components in `apps/web/src/components/ui`; design
  tokens in `globals.css`; `npx shadcn add <component>` works.
