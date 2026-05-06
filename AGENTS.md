# AGENTS.md

## Commands

```bash
pnpm dev              # start frontend + backend in parallel
pnpm build            # build all packages
pnpm typecheck        # tsc --noEmit across all packages
pnpm db:generate      # drizzle-kit generate (backend only)
pnpm db:migrate       # drizzle-kit migrate (backend only)
```

- Lint runs no-op scripts; no test commands exist.
- DB: run `pnpm db:generate` before `pnpm db:migrate`.

## Structure

- `apps/backend` — Fastify API, SQLite/Drizzle, AI, Java execution
- `apps/web` — React + Vite + Tailwind + Monaco
- `packages/shared` — shared types (ESM, no deps)

Entrypoints: `apps/backend/src/index.ts`, frontend `http://localhost:5173`, backend `http://localhost:4000`

## Database

- SQLite via `better-sqlite3`, ORM is Drizzle
- Schema: `apps/backend/src/db/schema.ts`
- Migrations: `apps/backend/data/migrations/` (gitignored, generated)
- DB file: `apps/backend/data/dsa_lab.db` (gitignored)
- Drizzle config: `apps/backend/drizzle.config.ts`

## Environment

```bash
cp .env.example .env
```

Required: `OPENAI_BASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL`
Java execution needs JDK 17+ (`java`/`javac` in PATH).

## Quirks

- Java code execution is local only — backend writes temp files, compiles, runs, compares output
- `EXECUTION_TIMEOUT_MS` (default 2000) bounds per-test-case runtime
- No CI workflows or pre-commit hooks configured
- Shared package referenced via `workspace:*` protocol
