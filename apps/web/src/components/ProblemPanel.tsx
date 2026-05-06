import type { ProblemDetail } from "@dsa-lab/shared";

export function ProblemPanel({ problem }: { problem: ProblemDetail }) {
  return (
    <section className="panel p-4 md:p-5">
      <h2 className="mb-2 text-2xl font-semibold text-slate-100">{problem.title}</h2>
      <div className="mb-3 flex flex-wrap gap-2">
        <span className="pill rounded-full px-3 py-1 text-xs uppercase">{problem.difficulty}</span>
        {problem.tags.map((tag) => (
          <span key={tag} className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-300">
            {tag}
          </span>
        ))}
      </div>

      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-200">{problem.statement}</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-100">Constraints</h3>
          <ul className="space-y-1 text-sm text-slate-300">
            {problem.constraints.map((c) => (
              <li key={c}>• {c}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-100">Complexity Target</h3>
          <p className="text-sm text-slate-300">{problem.expectedComplexity}</p>
        </div>
      </div>

      <div className="mt-5">
        <h3 className="mb-2 text-sm font-semibold text-slate-100">Examples</h3>
        <div className="space-y-3">
          {problem.examples.map((ex, idx) => (
            <div key={`${idx}-${ex.input}`} className="rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-sm">
              <p className="text-slate-300">Input: {ex.input}</p>
              <p className="text-slate-300">Output: {ex.output}</p>
              {ex.explanation ? <p className="text-slate-400">{ex.explanation}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
