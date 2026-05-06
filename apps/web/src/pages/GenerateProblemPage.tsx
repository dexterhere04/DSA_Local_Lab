import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ProblemDetail } from "@dsa-lab/shared";
import { api } from "../services/api";

const GENERATION_STEPS = [
  { title: "Analyzing prompt", desc: "Identifying core algorithmic concept" },
  { title: "Generating problem", desc: "Crafting statement, constraints, and examples" },
  { title: "Creating test cases", desc: "Building public and hidden test suites" },
  { title: "Producing starter code", desc: "Writing function signature and scaffolding" },
  { title: "Saving problem", desc: "Storing to your local problem library" }
];

interface RecentGen {
  id: number;
  title: string;
  difficulty: string;
  createdAt: string;
}

export function GenerateProblemPage() {
  const [input, setInput] = useState("Coin Change");
  const [isCustomProblem, setIsCustomProblem] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [generated, setGenerated] = useState<ProblemDetail | null>(null);
  const [recent, setRecent] = useState<RecentGen[]>([]);
  const navigate = useNavigate();
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    api.listProblems().then((list) => {
      const items = list.slice(-5).map((p) => ({
        id: p.id,
        title: p.title,
        difficulty: p.difficulty,
        createdAt: p.createdAt
      }));
      setRecent(items);
    });
  }, []);

  const startProgressSimulation = useCallback(() => {
    setActiveStep(0);
    setProgress(0);
    let step = 0;
    let prog = 0;

    intervalRef.current = window.setInterval(() => {
      step = Math.min(step + 0.04, GENERATION_STEPS.length - 1);
      prog = Math.min(prog + 1.5, 95);

      const currentStep = Math.floor(step);
      if (currentStep !== activeStep) {
        setActiveStep(currentStep);
      }
      setProgress(prog);
    }, 120);
  }, [activeStep]);

  const stopProgressSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const completeProgress = useCallback(() => {
    setActiveStep(GENERATION_STEPS.length - 1);
    setProgress(100);
  }, []);

  const onGenerate = async () => {
    if (!input.trim() || input.trim().length < 2) return;
    setLoading(true);
    setError(null);
    setGenerated(null);
    startProgressSimulation();
    try {
      const result = await api.generateProblem({ input, isCustomProblem });
      stopProgressSimulation();
      completeProgress();
      setGenerated(result);
    } catch (err) {
      stopProgressSimulation();
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onOpenProblem = () => {
    if (generated) {
      navigate(`/solve?problemId=${generated.id}`);
    }
  };

  const onRegenerate = () => {
    setGenerated(null);
    setActiveStep(0);
    setProgress(0);
    setError(null);
  };

  const onRecentClick = (id: number) => {
    navigate(`/solve?problemId=${id}`);
  };

  return (
    <div className="animate-in">
      <div className="mb-8">
        <h2 className="font-serif text-2xl tracking-[-0.02em] text-[var(--text)] mb-2">Generate Problem</h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-md leading-relaxed">
          Enter a DSA concept or describe a custom problem. The AI will generate a complete problem specification with test cases.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
        <div>
          {!generated ? (
            <div className="card">
              {!loading && (
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

                  {error && (
                    <div className="rounded-md border border-[var(--error-border)] bg-[var(--error-dim)] p-3 text-sm text-[var(--error)]">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={onGenerate}
                    disabled={!input.trim() || input.trim().length < 2}
                    className="btn btn-primary btn-lg"
                  >
                    Generate
                  </button>
                </div>
              )}

              {loading && (
                <div className="py-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                    <span className="text-sm text-[var(--text-secondary)]">
                      Generating your problem...
                    </span>
                  </div>

                  <div className="progress-steps">
                    {GENERATION_STEPS.map((step, idx) => {
                      const isDone = idx < activeStep;
                      const isActive = idx === activeStep;

                      return (
                        <div
                          key={step.title}
                          className={`progress-step ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}
                        >
                          <div className="progress-step-icon">
                            {isDone && (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {isActive && (
                              <div className="icon-spinner spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
                            )}
                          </div>
                          <div className="progress-step-content">
                            <div className="progress-step-title">{step.title}</div>
                            {isActive && (
                              <div className="progress-step-desc">{step.desc}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="card success-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--success-dim)]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-serif text-lg text-[var(--text)]">{generated.title}</h3>
                    <p className="text-xs text-[var(--text-tertiary)]">Problem generated successfully</p>
                  </div>
                </div>

                <div className="success-meta">
                  <div className="success-meta-item">
                    Difficulty: <span className={`badge badge-${generated.difficulty}`}>{generated.difficulty}</span>
                  </div>
                  <div className="success-meta-item">
                    Tests: <span>{generated.publicTests.length} cases</span>
                  </div>
                  <div className="success-meta-item">
                    Tags: <span>{generated.tags.join(", ")}</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button onClick={onOpenProblem} className="btn btn-primary">
                    Open in Editor
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                  <button onClick={onRegenerate} className="btn btn-secondary">
                    Generate Another
                  </button>
                </div>
              </div>

              <div className="card">
                <h3 className="section-label">Problem Preview</h3>
                <div className="code-block whitespace-pre-wrap leading-7 text-sm max-h-64 overflow-y-auto pr-2">
                  {generated.statement}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {recent.length > 0 && (
            <div>
              <h3 className="section-label mb-3">Recent</h3>
              <div className="space-y-1">
                {recent.map((gen) => (
                  <div key={gen.id} className="recent-gen" onClick={() => onRecentClick(gen.id)}>
                    <div>
                      <div className="recent-gen-title">{gen.title}</div>
                      <div className="recent-gen-meta">{gen.difficulty}</div>
                    </div>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-tertiary)] flex-shrink-0">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="section-label mb-3">Tips</h3>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li className="flex gap-2.5">
                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-[var(--accent)] opacity-50" />
                Be specific with algorithm concepts
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-[var(--accent)] opacity-50" />
                Custom mode uses your full statement
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-[var(--accent)] opacity-50" />
                Generated problems include test cases
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
