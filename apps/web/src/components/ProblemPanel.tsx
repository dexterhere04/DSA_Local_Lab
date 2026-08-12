import type { ProblemDetail } from "@dsa-lab/shared";

export function ProblemPanel({ problem, compact }: { problem: ProblemDetail; compact?: boolean }) {
  return (
    <div className="animate-in">
      {compact ? null : (
        <>
          <h2 className="font-serif text-2xl tracking-[-0.02em] text-[var(--text)]">{problem.title}</h2>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className={`badge badge-${problem.difficulty}`}>{problem.difficulty}</span>
            {problem.tags.map((tag) => (
              <span key={tag} className="badge badge-tag">{tag}</span>
            ))}
          </div>
          <div className="divider" />
        </>
      )}

      <div className="code-block whitespace-pre-wrap leading-7">{problem.statement}</div>

      <div className="divider" />

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="section-label">Constraints</h3>
          <ul className="space-y-2 text-sm text-[var(--text)]">
            {problem.constraints.map((c, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-[var(--text-tertiary)]" />
                {c}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="section-label">Complexity Target</h3>
          <p className="font-mono text-sm text-[var(--text)]">{problem.expectedComplexity}</p>
        </div>
      </div>

      <div className="divider" />

      <div>
        <h3 className="section-label">Examples</h3>
        <div className="space-y-3">
          {problem.examples.map((ex, idx) => (
            <div key={idx} className="rounded-md border border-[var(--border)] bg-[var(--bg)] p-4">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                Example {idx + 1}
              </p>
              <div className="space-y-1 font-mono text-sm">
                <p className="text-[var(--text)]">
                  <span className="text-[var(--text-secondary)]">Input: </span>
                  {ex.input}
                </p>
                <p className="text-[var(--text)]">
                  <span className="text-[var(--text-secondary)]">Output: </span>
                  {ex.output}
                </p>
                {ex.explanation && (
                  <p className="text-[var(--text-secondary)] pt-1">{ex.explanation}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {problem.hints.length > 0 && (
        <>
          <div className="divider" />
          <div>
            <h3 className="section-label">Hints</h3>
            <ul className="space-y-2 text-sm text-[var(--text)]">
              {problem.hints.map((h, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-[var(--accent)] opacity-50" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {problem.edgeCases.length > 0 && (
        <>
          <div className="divider" />
          <div>
            <h3 className="section-label">Edge Cases</h3>
            <ul className="space-y-2 text-sm text-[var(--text)]">
              {problem.edgeCases.map((e, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-[var(--accent)] opacity-30" />
                  {e}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
