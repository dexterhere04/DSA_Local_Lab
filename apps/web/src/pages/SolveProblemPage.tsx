import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { ProblemDetail, ProblemListItem, SubmissionResponse } from "@dsa-lab/shared";
import { api } from "../services/api";
import { EditorPanel } from "../components/EditorPanel";
import { ProblemPanel } from "../components/ProblemPanel";
import { TestResultPanel } from "../components/TestResultPanel";

export function SolveProblemPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [problemList, setProblemList] = useState<ProblemListItem[]>([]);
  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<SubmissionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProblemId = useMemo(() => Number(searchParams.get("problemId") ?? 0), [searchParams]);

  useEffect(() => {
    api.listProblems().then((list) => {
      setProblemList(list);
      if (!selectedProblemId && list[0]) {
        setSearchParams({ problemId: String(list[0].id) });
      }
    });
  }, [selectedProblemId, setSearchParams]);

  useEffect(() => {
    if (!selectedProblemId) {
      return;
    }

    setError(null);
    api
      .getProblem(selectedProblemId)
      .then((value) => {
        setProblem(value);
        setCode(value.starterCode);
        setResult(null);
      })
      .catch((err: Error) => setError(err.message));
  }, [selectedProblemId]);

  const execute = async (mode: "run" | "submit") => {
    if (!problem) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = await api.runSubmission({
        problemId: problem.id,
        code,
        mode
      });
      setResult(payload);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="panel p-3">
        <label className="text-sm text-slate-300">Choose problem</label>
        <select
          className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={selectedProblemId || ""}
          onChange={(e) => setSearchParams({ problemId: e.target.value })}
        >
          {problemList.map((item) => (
            <option value={item.id} key={item.id}>
              {item.title} ({item.difficulty})
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {problem ? (
        <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
          <ProblemPanel problem={problem} />

          <div className="space-y-4">
            <EditorPanel code={code} onChange={setCode} />
            <div className="flex gap-2">
              <button
                onClick={() => execute("run")}
                disabled={loading}
                className="rounded-lg border border-emerald-500 px-4 py-2 text-sm text-emerald-300 disabled:opacity-60"
              >
                {loading ? "Running..." : "Run"}
              </button>
              <button
                onClick={() => execute("submit")}
                disabled={loading}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>
            <TestResultPanel result={result} />
          </div>
        </div>
      ) : (
        <section className="panel p-5 text-sm text-slate-400">No problem selected.</section>
      )}
    </div>
  );
}
