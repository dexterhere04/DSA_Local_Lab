import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ProblemListItem } from "@dsa-lab/shared";
import { api } from "../services/api";

export function DashboardPage() {
  const [problems, setProblems] = useState<ProblemListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listProblems()
      .then(setProblems)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-[1.8fr_1fr]">
      <section className="panel p-5">
        <h1 className="text-2xl font-semibold">Local DSA Playground</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Generate AI-driven DSA questions from topics or custom prompts, solve in Java, and validate with hidden/public tests.
        </p>
        <div className="mt-4 flex gap-3">
          <Link to="/generate" className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950">
            Generate Problem
          </Link>
          <Link to="/solve" className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200">
            Solve Problems
          </Link>
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="text-lg font-semibold">MVP Focus</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          <li>• Java-first execution via Judge0</li>
          <li>• AI problem and hint generation</li>
          <li>• Hidden/public test support</li>
          <li>• Local SQLite progress tracking</li>
        </ul>
      </section>

      <section className="panel p-5 md:col-span-2">
        <h2 className="mb-3 text-lg font-semibold">Recent Problems</h2>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <div className="space-y-2">
          {problems.map((problem) => (
            <Link
              key={problem.id}
              to={`/solve?problemId=${problem.id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm hover:border-emerald-500/50"
            >
              <span>{problem.title}</span>
              <span className="text-slate-400">{problem.difficulty}</span>
            </Link>
          ))}
          {problems.length === 0 ? <p className="text-sm text-slate-400">No problems yet. Generate one to begin.</p> : null}
        </div>
      </section>
    </div>
  );
}
