# DSA Lab AI Architecture

## Goals
- Local-first, low-resource, beginner-friendly DSA platform.
- AI-assisted problem authoring and test generation.
- Fast local Java execution for self-hosted learning.

## High-Level Design
- Frontend: React + Vite + Tailwind + Monaco.
- Backend: Fastify modular API.
- Persistence: SQLite via Drizzle ORM.
- Execution: local Java (`javac` + `java`) subprocess abstraction.
- AI: OpenAI-compatible provider abstraction with prompt templates.

## Monorepo Structure
- `apps/web`: user-facing UI.
- `apps/backend`: API, AI orchestration, judge integration, database logic.
- `packages/shared`: shared TypeScript models.
- `docs`: architecture and roadmap.

## Module Boundaries (Backend)
- `routes/*`: HTTP contract and validation.
- `services/problemGenerationService.ts`: AI generation orchestration.
- `services/localJavaExecutionService.ts`: local code execution adapter.
- `services/problemService.ts`: persistence and local practice workflows.
- `db/*`: schema and client setup.

## Extensibility
- Add languages by introducing language adapters (`java`, `cpp`, `python`, `rust`) behind judge service interface.
- Add AI providers by extending `aiProvider` strategy.
- Add spaced repetition by adding review scheduling tables and dashboard widgets.
