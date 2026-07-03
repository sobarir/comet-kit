# create-cometkit-app

Scaffold a **CometKit** project: Turborepo + NestJS/Fastify + Drizzle
(ULID primary keys) + Next.js, pre-wired with the Comet spec-driven agent
workflow (OpenSpec + Superpowers), grill-me, and UI UX Pro Max — for
**Claude Code** and **Google Antigravity**.

```bash
bunx create-cometkit-app my-app
# or
npx create-cometkit-app my-app
```

Requires: Node 20+, bun, git, Python 3, and a local PostgreSQL 17+.

What it does: doctor checks → template → `.env` with generated JWT secret →
PostgreSQL 17+ check (creates the database) → install → migrate + seed →
installs the agent workflow into both `.claude/skills/` and
`.agents/skills/` → git init.

Then open Claude Code or Antigravity and type `/comet "your feature idea"`.

Options: `--db-url <url>`, `--template <dir>`, `--repo <owner/repo>`,
`--skip-workflow`, `--skip-db`, `--skip-install`, `--skip-git`,
`--allow-old-postgres`, `--yes`.
