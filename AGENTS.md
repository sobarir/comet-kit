# AGENTS.md — CometKit agent guide

CometKit is an agentic-AI-first starter kit. This file is the canonical
guide for EVERY coding agent working in this repo — Claude Code reads it
via CLAUDE.md, Google Antigravity (IDE and CLI) reads it directly, and
other AGENTS.md-aware tools pick it up automatically. Features are built
through the Comet workflow (`/comet`) and must follow the conventions
below. When in
doubt, read `docs/FEATURE_PATTERN.md` and copy the structure of the worked
example: **user management** (`apps/api/src/users`, `apps/web/src/app/dashboard/users`).

## Commands

| Command                | Purpose                                        |
| ---------------------- | ---------------------------------------------- |
| `bun run dev`          | Watch mode: API :3001, web :3000               |
| `bun run verify`       | THE quality gate: typecheck + lint + test      |
| `bun run test:int` (in apps/api) | Integration tests (needs local Postgres) |
| `bun run db:generate`  | Generate SQL migration from schema changes     |
| `bun run db:migrate`   | Apply migrations (ALWAYS before db:seed)       |
| `bun run db:seed`      | Seed demo accounts                             |

A feature is not done until `bun run verify` passes.

## Source-of-truth boundaries (DRY rules)

1. **Wire shapes live in `packages/shared`** — every request schema (Zod)
   and response type (interface). Never define a request/response shape
   inside an app.
2. **Columns live in `packages/db`** — tables, enums, inferred `User`-style
   row types. Never redeclare a persisted shape elsewhere.
3. **Enums/constants shared by both live in `packages/shared`**
   (e.g. `USER_ROLES`) and the Drizzle `pgEnum` derives from them.
   Dependency direction: `shared ← db ← api`, `shared ← web`. Never reverse.
4. **Contract↔persistence compatibility is enforced by typed mappers** in
   services (e.g. `toUserDto`). If they drift, `bun run verify` fails.
   We deliberately do not use drizzle-zod: it would couple web bundles to
   drizzle or reintroduce duplicate refinement.
5. One concern, one place: password hashing only in
   `apps/api/src/common/password.ts`; ULID/timestamps only via
   `packages/db/src/columns.ts` helpers; the error envelope only in
   `apps/api/src/common/http-exception.filter.ts`.

## Error handling

- API: throw Nest `HttpException` subclasses (`NotFoundException`,
  `ForbiddenException`, `ConflictException`…). Never `try/catch` to shape
  errors in controllers — the global `AllExceptionsFilter` renders the one
  envelope (`ApiErrorBody` in shared): statusCode, error, message,
  errors? (Zod fields), requestId, path, timestamp.
- Validation: `ZodValidationPipe` with a schema from `shared` on every
  body/query. Its field errors surface in the envelope's `errors`.
- Web: read errors only through `readApiError()` (`src/lib/api.ts`), render
  near the action that failed with `role="alert"`. Errors state what
  happened and what to do next; no apologies, no vagueness.

## Logging

- Transport: nestjs-pino. Every request has a ULID request id (`x-request-id`
  response header) — correlate logs with it.
- Services log **domain events**, not chatter: inject
  `@InjectPinoLogger(MyService.name)` and log with a structured object plus
  a `noun.verb` event name, e.g.
  `this.logger.info({ userId }, "user.created")`.
- Levels: `info` = domain events; `warn` = expected-but-notable; `error` =
  5xx/unhandled (the exception filter does this — don't double-log).
  Never log passwords, hashes, or tokens. Prefer ids over emails.

## Auth & RBAC

- Roles come from `USER_ROLES` in shared ("admin" | "user").
- Protect routes with `@UseGuards(JwtAuthGuard, RolesGuard)` +
  `@Roles("admin")`. Role is read fresh from the DB per request, so role
  changes apply to existing tokens immediately.
- Ownership rules are pure functions in `*.policy.ts` (see
  `users.policy.ts`) — decisions in policies, HTTP exceptions in services.

## Testing

- Unit specs (`*.spec.ts`) run in `verify`; DB-free. Put logic worth testing
  into pure policy/helper functions and test those; mock services at their
  boundary (see `auth.service.spec.ts`, `users.policy.spec.ts`,
  `roles.guard.spec.ts`).
- Integration specs (`*.int.spec.ts`) hit the real Postgres via
  `bun run test:int`; they clean up their own rows (see
  `users.service.int.spec.ts`).
- Every feature ships: policy/service unit specs + one integration spec for
  DB-touching paths.

## Known gotchas (learned the hard way — don't rediscover)

- TypeScript 6: use `module`/`moduleResolution: nodenext` (base tsconfig);
  `baseUrl` is deprecated; builds need explicit `rootDir`.
- Zod 4 idioms: `z.email()`, `z.flattenError(err)`, `ZodType` — not the
  deprecated v3 forms.
- ky v2: `prefix` (not `prefixUrl`); hooks receive `{ request, options }`.
- Vitest + Nest: SWC plugin with `module.type = "es6"` (CJS output cannot
  import Vitest). Decorator metadata comes from SWC, not tsc.
- Always `db:migrate` before `db:seed`.
- Nest route order: static segments (`me`) before parameterized (`:id`).
- New runtime imports must be declared in that package's package.json —
  bun's isolated linker does not hoist.
- Dependencies track `@latest`; resolve real versions from npm, not memory.

## Resuming work — "where are we now?"

When the user asks where things stand, what the status is, or wants to
continue previous work (in any wording), do NOT answer from memory or
guess from recent files. Reconstruct state from disk, in this order:

1. `.comet.yaml` — active change, current phase, mode, verify result.
   If the Comet workflow is installed, prefer running `/comet` (resume)
   or `comet status` (report only) over reading raw files.
2. `openspec/changes/` — active change folders; each `tasks.md` shows
   exactly which tasks are done (checked) and which remain. Archived
   changes live under `openspec/changes/archive/` — that is the "done"
   list; there is no separate roadmap file.
3. `git status` + current branch + recent log — uncommitted work and
   the change branch you are on.

Then report in Comet vocabulary: active change(s), current phase, tasks
remaining, verify result, and the single next command (usually
`/comet continue`).

## Platform notes (Claude Code & Antigravity)

- Skills live in both `.claude/skills/` (Claude Code) and `.agents/skills/`
  (Antigravity) — same SKILL.md format. `comet init` installs to both;
  if a skill is missing on one platform, copy its folder across.
- Antigravity agents start each session fresh (no persistent session
  context). Rely on the Comet state machine: run `/comet` or
  `/comet continue` to resume from `.comet.yaml` instead of re-explaining
  progress.
- Workflow state scripts require a bash-compatible shell (Git Bash on
  Windows) regardless of platform.

## Frontend conventions

- Design tokens are CSS variables in `apps/web/src/app/globals.css`
  ("launch pad at dawn" palette; display=Space Grotesk, body=Instrument
  Sans, mono=IBM Plex Mono for telemetry-style labels like ULIDs/statuses).
- UI primitives in `src/components/ui` (shadcn idiom). Add new ones with
  `npx shadcn add` or by hand in the same style.
- Data fetching: TanStack Query hooks in `src/hooks`, query keys
  `[resource, params]` (see `use-users.ts`), mutations invalidate the
  resource root. All HTTP via the shared `api` ky instance.
- Copy: sentence case, plain verbs, buttons say what they do.
