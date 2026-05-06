import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

export function GenerateProblemPage() {
  const [input, setInput] = useState("Coin Change");
  const [isCustomProblem, setIsCustomProblem] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const onGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.generateProblem({ input, isCustomProblem });
      navigate(`/solve?problemId=${result.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel mx-auto max-w-3xl p-5">
      <h1 className="text-2xl font-semibold">Generate Problem</h1>
      <p className="mt-2 text-sm text-slate-300">
        Enter a DSA concept (for example, Longest Increasing Subsequence) or toggle custom mode to provide a free-form problem idea.
      </p>

      <div className="mt-5 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-slate-300">Concept or prompt</span>
          <textarea
            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 p-3 text-slate-100 outline-none focus:border-emerald-500"
            rows={6}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </label>

        <label className="inline-flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            className="accent-emerald-500"
            checked={isCustomProblem}
            onChange={(e) => setIsCustomProblem(e.target.checked)}
          />
          Treat input as custom problem statement
        </label>

        <button
          onClick={onGenerate}
          disabled={loading || input.trim().length < 2}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 disabled:opacity-60"
        >
          {loading ? "Generating..." : "Generate and Save"}
        </button>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}
      </div>
    </section>
  );
}
