import type { SubmissionResponse } from "@dsa-lab/shared";

export function TestResultPanel({ result }: { result: SubmissionResponse | null }) {
  return (
    <section className="panel p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-100">Test Panel</h3>
      {!result ? <p className="text-sm text-slate-400">Run code to see test output.</p> : null}

      {result ? (
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs ${
                result.status === "accepted"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-red-500/20 text-red-300"
              }`}
            >
              {result.status.toUpperCase()}
            </span>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
              {result.passedCount}/{result.totalCount} tests
            </span>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
              {result.runtimeMs ?? 0} ms
            </span>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
              {result.memoryKb ?? 0} KB
            </span>
          </div>

          <div className="max-h-64 space-y-2 overflow-auto pr-1">
            {result.results.map((test, idx) => (
              <div key={`${idx}-${test.input}`} className="rounded-md border border-slate-700 bg-slate-900/70 p-3">
                <p className={test.passed ? "text-emerald-300" : "text-red-300"}>
                  {test.passed ? "PASS" : "FAIL"}
                </p>
                <p className="text-slate-400">Input: {test.input}</p>
                <p className="text-slate-400">Expected: {test.expectedOutput}</p>
                <p className="text-slate-300">Actual: {test.actualOutput || "(empty)"}</p>
                {test.error ? <p className="mt-1 text-xs text-red-300">{test.error}</p> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
