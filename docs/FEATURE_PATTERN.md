# The Feature Pattern

Every feature in CometKit is a vertical slice built in the same order.
The worked example is **user management** — file references below point at
it. Copy its structure, not just its ideas. `AGENTS.md` holds the global
rules (DRY boundaries, error envelope, logging levels); this file is the
step-by-step recipe.

```
shared (contract) → db (schema+migration) → api (module) → web (hooks+page) → tests → verify
```

## 1. Contract — packages/shared/src/<feature>.ts

Define what crosses the wire, and nothing else:
- Zod request schemas (`createUserSchema`, `updateUserSchema`,
  `listUsersQuerySchema`) — inputs validated at the edge.
- Response interfaces (`UserDto`, `Paginated<T>`) — dates as ISO strings.
- Shared constants/enums used by both DB and UI (`USER_ROLES` in
  `constants.ts`).
Export from `src/index.ts`. Reference: `packages/shared/src/users.ts`.

## 2. Schema — packages/db/src/schema/<feature>.ts

- Every table: `id: ulidPk()`, `...timestamps` (from `../columns`).
- Foreign keys via `ulidRef("owner_id").references(() => users.id)`.
- Enums derive from shared constants: `pgEnum("user_role", USER_ROLES)`.
- Export the table + `$inferSelect` / `$inferInsert` types; re-export in
  `schema/index.ts`.
- Then: `bun run db:generate` → review the SQL in `packages/db/drizzle/` →
  `bun run db:migrate`. Update `src/seed.ts` if demo data helps.
Reference: `packages/db/src/schema/users.ts`.

## 3. API module — apps/api/src/<feature>/

Four files, each with one job:
- `<feature>.policy.ts` — pure domain rules, no I/O. Predicates
  (`canDeleteUser`), DTO mappers (`toUserDto` — never leak secrets),
  math (`buildPageMeta`).
- `<feature>.service.ts` — DB access via `@Inject(DB)` + business flow.
  Throws `HttpException`s; logs domain events
  (`this.logger.info({ userId }, "user.created")`).
- `<feature>.controller.ts` — thin: guards + pipes + delegation.
  `@UseGuards(JwtAuthGuard, RolesGuard)`, `@Roles("admin")` where needed,
  `ZodValidationPipe` with the shared schema on every body/query.
  Static routes before `:id` routes. 204 for deletes.
- `<feature>.module.ts` — wire providers/controllers; import into
  `AppModule`.
Reference: `apps/api/src/users/*`.

Pagination convention: offset-based, `?page&limit`, newest first
(`orderBy(desc(table.id))` — ULIDs sort by creation time), response is
`Paginated<T>`.

## 4. Web — apps/web/src/hooks + src/app/

- `src/hooks/use-<feature>.ts`: a `<feature>Keys` object
  (`[resource, params]`), `useQuery` for reads with
  `placeholderData: (prev) => prev` for pagination, mutations that
  invalidate the resource root.
- Page under `src/app/...`: client component, guard by role from `useMe()`
  (server enforces anyway — the UI guard is UX, not security), forms with
  labels bound by `htmlFor`, errors via `readApiError` in a `role="alert"`
  element next to the action, disabled states while pending.
- Use ui primitives from `src/components/ui`; mono font for telemetry
  (ULIDs, roles, counts).
Reference: `apps/web/src/hooks/use-users.ts`,
`apps/web/src/app/dashboard/users/page.tsx`.

## 5. Tests

- `<feature>.policy.spec.ts` — every policy function, including the
  "never leaks passwordHash" style of assertion.
- Guard/edge specs where behavior is subtle (`roles.guard.spec.ts`).
- `<feature>.service.int.spec.ts` — one integration spec against real
  Postgres exercising the happy path + one refusal; creates unique rows
  (ULID suffix) and deletes them in `afterAll`.

## 6. Verify

`bun run verify` (typecheck + lint + unit tests) must pass — it is the
Comet workflow's Verify-phase gate. Run `bun run test:int` (in apps/api)
when the database is up. Then update seeds/docs if the feature changed
either.

## Definition of done

- [ ] Contract in shared; no wire shapes defined in apps
- [ ] Schema uses ulidPk/timestamps; migration generated AND applied
- [ ] Policy pure; service logs domain events; controller thin
- [ ] Errors: thrown as HttpExceptions only; envelope untouched
- [ ] Web hooks follow the query-key convention; errors via readApiError
- [ ] Unit + integration specs in place
- [ ] `bun run verify` green
