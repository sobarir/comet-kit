# Troubleshooting: Claude Code hook errors

If you see a `PreToolUse` or `UserPromptSubmit` **hook error** after scaffolding a
CometKit project, it is almost always one of the two below. Both are
**non-blocking** — your work still happens — but they are noisy and, in the first
case, mean the Comet phase guard is silently not running.

> Portable doc: this page is meant to be copied into the CometKit README/docs.

---

## 1. Comet phase-guard hook: `No such file or directory` (mainly Windows)

### Symptom

```
PreToolUse:Edit hook error
Failed with non-blocking status code: bash: .claude/skills/comet/scripts/comet-hook-guard.sh: No such file or directory
```

…even though the file clearly exists.

### Cause

Comet installs a `PreToolUse` hook in your project's
**`.claude/settings.local.json`** with a **working-directory-relative** command:

```json
"command": "bash .claude/skills/comet/scripts/comet-hook-guard.sh"
```

The hook runs with the shell's current working directory. On **Windows / Git
Bash** that directory is often *not* the project root — e.g. after the agent
`cd`s into `apps/api` to run integration tests — so the relative path
`.claude/skills/...` doesn't resolve and bash reports "No such file or
directory". (The script, its shebang, and line endings are all fine; only the
*invocation* is fragile.)

### Fix — pick one

Open **`.claude/settings.local.json`**. It looks roughly like this:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/skills/comet/scripts/comet-hook-guard.sh"
          }
        ]
      }
    ]
  },
  "permissions": {
    "allow": ["Bash(openspec list *)"]
  }
}
```

**Option A — Disable the hook (recommended, simplest).** Remove the `hooks`
block. You lose the *automatic* write-blocking, but Comet still enforces phases
at each `comet-guard` / `comet-state` transition, and the
`.claude/rules/comet-phase-guard.md` rule still guides the agent:

```json
{
  "permissions": {
    "allow": ["Bash(openspec list *)"]
  }
}
```

**Option B — Keep the guard, made CWD-independent.** Anchor the command to the
project root (Claude Code provides `$CLAUDE_PROJECT_DIR` to hooks), which fixes
both finding the script *and* the script's own project-root assumptions:

```json
"command": "cd \"$CLAUDE_PROJECT_DIR\" && bash .claude/skills/comet/scripts/comet-hook-guard.sh"
```

### Verify

From a subdirectory (the case that used to fail):

```bash
cd apps/api
printf '{"tool_name":"Edit","tool_input":{"file_path":"x.ts"}}' \
  | (cd "$CLAUDE_PROJECT_DIR" && bash .claude/skills/comet/scripts/comet-hook-guard.sh)
echo "exit=$?"
```

The hook now runs (no "No such file or directory"): `exit=0` when allowed, or
`exit=2` when the phase guard blocks — never `exit=127`. With Option A, no hook
runs at all and the error is simply gone.

---

## 2. (Optional) A global hook can't find an npm-installed CLI

This is **not** a CometKit hook — you only hit it if you have your *own* global
Claude Code hooks (in `~/.claude/settings.json`) that call an npm-installed CLI,
**and** you override `env.PATH` there. Example (CodeGraph):

```
UserPromptSubmit hook error
Failed with non-blocking status code: /usr/bin/bash: line 1: codegraph: command not found
```

### Cause & fix

The hook runs via bash with your overridden `env.PATH`, which omits the npm
global bin and/or Node. Add both to that `PATH` (Windows paths shown; Git Bash
converts them automatically):

- Node: `C:\Program Files\nodejs`
- npm global bin: `C:\Users\<you>\AppData\Roaming\npm`

```json
"env": {
  "PATH": "C:\\Program Files\\nodejs;C:\\Users\\<you>\\AppData\\Roaming\\npm;<your existing entries…>"
}
```

Then restart the session so the new `PATH` is picked up.

---

## Maintainer note

The durable upstream fix for issue #1 is to install the hook **CWD-safe** in the
first place — have the Comet installer (`@rpamis/comet`) emit
`cd "$CLAUDE_PROJECT_DIR" && bash .claude/skills/comet/scripts/comet-hook-guard.sh`,
or have `create-cometkit-app` post-process `.claude/settings.local.json` after the
workflow-install step. Until then, this page is the workaround to ship to users.
