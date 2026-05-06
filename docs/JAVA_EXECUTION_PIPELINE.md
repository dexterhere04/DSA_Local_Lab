# Java Execution Pipeline

## Flow
1. User edits `Solution.java` in Monaco.
2. Frontend calls `POST /api/submissions` with mode:
   - `run`: public tests only.
   - `submit`: public + hidden tests.
3. Backend wraps user code with `Runner` class for each test case.
4. Backend creates a temporary workspace and writes `Solution.java`.
5. Backend compiles with `javac`, then runs `java Runner`.
6. Backend enforces process timeout via `EXECUTION_TIMEOUT_MS`.
7. Backend compares stdout against expected output.
8. Backend stores aggregate result in `submissions`.
9. Frontend renders pass/fail, runtime, memory.

## Security Notes
- Java code executes locally for self-hosted learning.
- Execution timeout is enforced for compile/run subprocesses.
- Hidden tests are not returned for submit mode.
- Prefer Docker deployment if stronger host isolation is required.

## Future Improvements
- Per-problem custom limits.
- Linux cgroup-based CPU/memory controls.
- Output normalizer hooks.
- Deterministic runner for multi-line structured inputs.
