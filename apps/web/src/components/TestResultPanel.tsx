import type { SubmissionResponse } from "@dsa-lab/shared";

export function TestResultPanel({ result }: { result: SubmissionResponse | null }) {
  if (!result) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-[var(--text-tertiary)]">
        Run your code to see test results.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {result.results.map((test, idx) => {
        const hiddenFailure = test.hidden && !test.passed;

        return (
          <div key={idx} className={`test-result ${test.passed ? "pass" : "fail"}`}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em]">
                {test.passed ? "Passed" : "Failed"}
                {test.hidden && <span className="ml-2 text-[var(--text-tertiary)]">(hidden)</span>}
              </span>
              {test.runtimeMs && (
                <span className="text-[10px] text-[var(--text-tertiary)]">{test.runtimeMs}ms</span>
              )}
            </div>

            {hiddenFailure ? (
              <div className="font-mono text-xs text-[var(--error)]">
                {test.reason ?? test.verdict ?? "Hidden test failed"}
              </div>
            ) : (
              <div className="space-y-0.5 font-mono text-xs">
                <p className="text-[var(--text-secondary)]">
                  <span className="text-[var(--text-tertiary)]">In: </span>
                  {test.input}
                </p>
                <p className="text-[var(--text-secondary)]">
                  <span className="text-[var(--text-tertiary)]">Exp: </span>
                  {test.expectedOutput}
                </p>
                <p className={test.passed ? "text-[var(--success)]" : "text-[var(--error)]"}>
                  <span className="text-[var(--text-tertiary)]">Got: </span>
                  {test.actualOutput || "(empty)"}
                </p>
                {test.error && <p className="text-[var(--error)]">{test.error}</p>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
