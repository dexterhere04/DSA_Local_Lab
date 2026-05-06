# API Routes

Base URL: `/api`

## Health
- `GET /health`

## Problems
- `GET /problems`
  - List all problems (title, difficulty, tags).
- `GET /problems/:id`
  - Fetch full problem including public/hidden tests.
- `POST /problems/generate`
  - Input: `{ input: string, isCustomProblem: boolean }`
  - Output: generated and persisted problem.
- `POST /problems`
  - Save user-authored custom problem payload.
- `GET /problems/:id/java-template`
  - Returns `Solution.java`, `LocalTestRunner.java`, sample input/output.
- `POST /problems/:id/generate-tests`
  - AI-generated additional tests.
- `POST /problems/:id/generate-hints`
  - AI-generated progressive hints.

## Submissions
- `GET /submissions`
  - Submission history.
- `POST /submissions`
  - Input: `{ problemId, code, mode: "run" | "submit" }`
  - `run`: evaluate public tests.
  - `submit`: evaluate public + hidden tests.

## Local Practice
- `GET /topics`
  - Aggregated topic counts.
- `GET /problem-sets`
  - User-created local sets.
- `POST /problem-sets`
  - Input: `{ name, description, problemIds[] }`.
