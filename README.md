# DSA Lab AI

Lightweight self-hosted AI-powered DSA practice platform inspired by LeetCode and HackerRank.

## What This MVP Includes
- AI Problem Generator from concept/topic or custom prompt.
- Polished problem output with constraints, examples, edge cases, hints, complexity target, difficulty, and tags.
- Public + hidden test case support.
- Java-first template generation (`Solution.java`, local runner, sample IO).
- Online Java code execution and judging through locally installed Java.
- Local practice mode with topic explorer, problem sets, and submission history.
- React + Vite + Tailwind + Monaco frontend.
- Fastify + SQLite + Drizzle backend.
- Dockerized local deployment.

## Architecture
- Frontend: `apps/web` (React, Monaco, Tailwind).
- Backend: `apps/backend` (Fastify API, AI orchestration, local Java execution integration).
- Shared models: `packages/shared`.
- Docs: `docs`.

## Folder Structure

```text
.
├── apps
│   ├── backend
│   │   ├── src
│   │   │   ├── config
│   │   │   ├── db
│   │   │   ├── routes
│   │   │   └── services
│   │   └── Dockerfile
│   └── web
│       ├── src
│       │   ├── components
│       │   ├── pages
│       │   └── services
│       └── Dockerfile
├── packages
│   └── shared
├── docs
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## Core API Endpoints
- `POST /api/problems/generate` -> AI problem generation + save.
- `GET /api/problems/:id/java-template` -> Java starter files.
- `POST /api/submissions` -> run/submit Java solution with local Java runtime.
- `GET /api/submissions` -> submission history.
- `GET /api/topics` -> topic explorer data.
- `POST /api/problem-sets` -> create local practice sets.

See detailed route docs in `docs/API_ROUTES.md`.

## Local Development Setup

### 1) Prerequisites
- Node.js 20+
- pnpm 9+
- Java JDK 8+ installed locally (`javac` and `java` available in PATH)
- OpenAI-compatible API key

### 2) Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
- `OPENAI_BASE_URL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `JAVA_BIN` (default: `java`)
- `JAVAC_BIN` (default: `javac`)
- `EXECUTION_TIMEOUT_MS` (default: `2000`)

### 3) Install Dependencies

```bash
pnpm install
```

### 4) Generate DB Migrations and Migrate

```bash
pnpm db:generate
pnpm db:migrate
```

### 5) Start Dev Servers

```bash
pnpm dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## Docker Deployment

```bash
docker compose up --build
```

Services:
- Web: `http://localhost:5173`
- API: `http://localhost:4000`

## Desktop App (Electron)

```bash
pnpm desktop:dev     # build + launch the desktop app (unpackaged)
pnpm desktop:build   # build + package a Linux AppImage (dist-electron/)
```

- The Electron shell spawns the bundled backend (`dist/index.cjs`) via `utilityProcess.fork` and loads it at `http://127.0.0.1:<free-port>`.
- The backend serves the built frontend same-origin; the DB lives in the app's `userData` dir.
- Configure the OpenAI key/base/model, Java paths, and timeout in the in-app **Settings** page (persisted to `userData/.env`).
- Java (JDK 8+) is an external prerequisite; the app shows a banner when it's missing.

## Local Java Execution Example
The backend writes wrapped code to a temporary directory, then runs:

```bash
javac Solution.java
java Runner
```

Execution is bounded by `EXECUTION_TIMEOUT_MS` and output is compared against expected results.

## Security Model
- Java code is executed locally for self-hosted use.
- Process timeout is enforced per test case.
- Hidden tests are withheld from submit response.
- For stronger isolation, run backend inside Docker and keep runtime limits conservative.

## Future Language Support
The architecture is prepared for language adapters (Java first, then C++, Python, Rust). Add language-specific:
- template builders,
- runner wrappers,
- runtime/compiler command mappings per language.

## Product Roadmap
See:
- `docs/MVP_IMPLEMENTATION_PLAN.md`
- `docs/ROADMAP.md`
- `docs/JAVA_EXECUTION_PIPELINE.md`
- `docs/PROMPT_ENGINEERING.md`
