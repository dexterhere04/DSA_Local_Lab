# MVP Implementation Plan

## Phase A: Core Platform (Done in scaffold)
- Monorepo setup with pnpm workspaces.
- Fastify API with modular routes.
- SQLite + Drizzle schema.
- React app with core pages.

## Phase B: AI Authoring (Done in scaffold)
- OpenAI-compatible provider abstraction.
- Prompt templates for problem/test/hint/solution generation.
- Problem generation endpoint with persistence.

## Phase C: Java Execution Pipeline (Done in scaffold)
- Local Java adapter for compile+run (`javac` + `java`).
- Run mode with public tests.
- Submit mode with hidden tests.
- Submission persistence and history.

## Phase D: DX + Safety (Partially done)
- Dockerfiles and compose.
- Env-driven configuration.
- Timeout-based local process controls.
- Next: cgroup limits, request size limits, audit logs.

## Phase E: Next Iteration
- Add language adapters (C++/Python/Rust).
- Spaced repetition scheduler.
- Problem pack import/export.
- Visualization widgets (heap/DP/graph).
