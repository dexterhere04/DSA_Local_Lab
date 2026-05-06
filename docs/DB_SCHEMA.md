# Database Schema (SQLite + Drizzle)

## `problems`
- `id` PK
- `title`, `slug`
- `source_type` (`ai_generated` | `custom`)
- `source_input`
- `statement`
- `constraints` JSON
- `examples` JSON
- `edge_cases` JSON
- `hints` JSON
- `function_signature`
- `starter_code`
- `expected_complexity`
- `difficulty` (`easy` | `medium` | `hard`)
- `tags` JSON
- `created_at`

## `test_cases`
- `id` PK
- `problem_id` FK
- `input`, `expected_output`
- `explanation`
- `is_hidden` boolean
- `weight`

## `submissions`
- `id` PK
- `problem_id` FK
- `language` (default `java`)
- `code`
- `mode` (`run` | `submit`)
- `status`
- `passed_count`, `total_count`
- `runtime_ms`, `memory_kb`
- `result_details` JSON
- `created_at`

## `problem_sets`
- `id` PK
- `name`, `description`
- `created_at`

## `problem_set_items`
- `id` PK
- `problem_set_id` FK
- `problem_id` FK
