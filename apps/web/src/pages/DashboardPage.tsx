import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ProblemListItem } from "@dsa-lab/shared";
import { api } from "../services/api";

export function DashboardPage() {
  const [problems, setProblems] = useState<ProblemListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [javaMissing, setJavaMissing] = useState(false);

  useEffect(() => {
    api
      .listProblems()
      .then((data) => {
        setProblems(data);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));

    api
      .getHealth()
      .then((h) => setJavaMissing(!h.java.available))
      .catch(() => setJavaMissing(false));
  }, []);

  return (
    <div className="animate-in">
      <div className="mb-8">
        <h2 className="font-serif text-2xl tracking-[-0.02em] text-[var(--text)] mb-2">Dashboard</h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-md leading-relaxed">
          Generate AI-powered DSA problems, solve them in Java, and track your progress.
        </p>
      </div>

      {javaMissing && (
        <div className="mb-6 rounded-md border border-[var(--error-border)] bg-[var(--error-dim)] p-3 text-sm text-[var(--error)] flex items-center gap-3">
          <span>Java runtime not detected. Code execution will fail.</span>
          <Link to="/settings" className="btn btn-secondary btn-sm ml-auto">
            Configure
          </Link>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="card animate-in" style={{ animationDelay: "0ms" }}>
          <div className="stat">
            <div className="stat-value">{problems.length}</div>
            <div className="stat-label">Problems</div>
          </div>
        </div>

        <Link to="/generate" className="card animate-in group" style={{ animationDelay: "60ms" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--accent-dim)] text-[var(--accent)] transition-colors group-hover:bg-[var(--accent)] group-hover:text-[#0a0a0a]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--text)]">Generate</div>
              <div className="text-xs text-[var(--text-tertiary)]">Create a new problem</div>
            </div>
          </div>
        </Link>

        <Link to="/solve" className="card animate-in group" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-secondary)] transition-colors group-hover:border-[var(--accent-border)] group-hover:text-[var(--accent)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--text)]">Solve</div>
              <div className="text-xs text-[var(--text-tertiary)]">Open the editor</div>
            </div>
          </div>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          Recent Problems
        </h3>
        {problems.length > 0 && (
          <Link to="/solve" className="btn btn-ghost btn-sm">
            View all
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-[var(--error)]">{error}</p>}

      {loading ? (
        <div className="card">
          <div className="flex items-center gap-3 text-sm text-[var(--text-tertiary)]">
            <div className="spinner" />
            Loading...
          </div>
        </div>
      ) : problems.length === 0 ? (
        <div className="card empty-state">
          <p>No problems yet. Generate one to get started.</p>
        </div>
      ) : (
        <div className="card !p-0">
          {problems.slice(0, 10).map((problem) => (
            <Link
              key={problem.id}
              to={`/solve?problemId=${problem.id}`}
              className="problem-item"
            >
              <span className="problem-item-title">{problem.title}</span>
              <div className="problem-item-meta">
                <span className={`badge badge-${problem.difficulty}`}>{problem.difficulty}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-tertiary)]">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
