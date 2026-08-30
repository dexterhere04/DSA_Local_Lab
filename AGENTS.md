# AGENTS.md

## Commands

```bash
pnpm dev              # start frontend + backend in parallel (browser dev)
pnpm build            # build all packages + bundle backend (index.cjs)
pnpm typecheck        # tsc --noEmit across all packages
pnpm db:generate      # drizzle-kit generate (backend only)
pnpm db:migrate       # drizzle-kit migrate (backend only)
pnpm desktop:dev      # build + rebuild native module for Electron, then launch desktop app
pnpm desktop:build    # build + package Linux AppImage (dist-electron/)
```

- Lint runs no-op scripts; no test commands exist.
- DB: run `pnpm db:generate` before `pnpm db:migrate`.

## Structure

- `apps/backend` — Fastify API, SQLite/Drizzle, AI, Java execution. Also serves the built frontend (`apps/web/dist`) in production/desktop.
- `apps/web` — React + Vite + Tailwind + Monaco
- `packages/shared` — shared types (ESM, no deps)
- `electron/` — desktop shell (`main.js`)
- `scripts/` — `bundle-backend.mjs` (esbuild → `dist/index.cjs`), `rebuild-native.mjs` (better-sqlite3 for Electron ABI), `stage-electron.mjs` (staging dir for packaging)

Entrypoints: `apps/backend/src/index.ts`, frontend `http://localhost:5173`, backend `http://localhost:4000`

## Desktop (Electron)

- `electron/main.js` picks a free port, spawns the bundled backend (`apps/backend/dist/index.cjs` in dev, `backend/index.cjs` packaged) via `utilityProcess.fork`, polls `/api/health`, then opens the window at `http://127.0.0.1:<port>`.
- The backend serves the built frontend same-origin (no CORS). Runtime config (OpenAI key/base/model, Java bins, timeout) lives in a `.env` in the app's `userData` dir, editable via the in-app Settings page (`/settings`) → `PUT /api/settings`.
- Java is an external prerequisite; `/api/health` reports availability and the UI shows a banner when missing.
- `better-sqlite3` is a native module: `rebuild-native.mjs` compiles it against Electron's Node ABI into `apps/backend/dist/node_modules/better-sqlite3`, which electron-builder ships via `extraResources`.

## Database

- SQLite via `better-sqlite3`, ORM is Drizzle
- Schema: `apps/backend/src/db/schema.ts`
- Migrations: `apps/backend/data/migrations/` (tracked; auto-applied at backend startup)
- DB file: `apps/backend/data/dsa_lab.db` (gitignored); desktop app uses `userData/dsa_lab.db`
- Drizzle config: `apps/backend/drizzle.config.ts`

## Environment

```bash
cp .env.example .env
```

Required: `OPENAI_BASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL`
Java execution needs JDK 8+ (`java`/`javac` in PATH).

## Quirks

- Java code execution is local only — backend writes temp files, compiles, runs, compares output
- `EXECUTION_TIMEOUT_MS` (default 2000) bounds per-test-case runtime
- No CI workflows or pre-commit hooks configured
- Shared package referenced via `workspace:*` protocol
- `pnpm build` produces `apps/backend/dist/index.cjs` (bundled); `index.js` remains the tsc output
