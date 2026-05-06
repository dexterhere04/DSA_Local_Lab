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
    if (!input.trim() || input.trim().length < 2) return;
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
    <div className="animate-in">
      <div className="mb-8">
        <h2 className="font-serif text-2xl tracking-[-0.02em] text-[var(--text)] mb-2">Generate Problem</h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-md leading-relaxed">
          Enter a DSA concept or describe a custom problem. AI will create the full specification with tests.
        </p>
      </div>

      <div className="max-w-2xl">
        <div className="card">
          <div className="space-y-5">
            <div>
              <label className="section-label mb-3 block">Concept or prompt</label>
              <textarea
                className="textarea"
                rows={8}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., Longest Increasing Subsequence, or describe your own problem..."
              />
            </div>

            <label className="toggle">
              <input
                type="checkbox"
                checked={isCustomProblem}
                onChange={(e) => setIsCustomProblem(e.target.checked)}
              />
              Treat as custom problem statement
            </label>

            {error && <p className="text-sm text-[var(--error)]">{error}</p>}

            <button
              onClick={onGenerate}
              disabled={loading || !input.trim() || input.trim().length < 2}
              className="btn btn-primary"
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  Generating...
                </>
              ) : (
                "Generate and Open"
              )}
            </button>
          </div>
        </div>

        <div className="card mt-4">
          <h3 className="section-label mb-3">Tips</h3>
          <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
            <li className="flex gap-3">
              <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-[var(--accent)] opacity-50" />
              Be specific with algorithm concepts for better results
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-[var(--accent)] opacity-50" />
              Custom mode lets you write the full problem statement yourself
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-[var(--accent)] opacity-50" />
              Generated problems include examples, constraints, and test cases
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
