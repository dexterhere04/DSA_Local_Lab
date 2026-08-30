import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ProblemDetail } from "@dsa-lab/shared";
import { api } from "../services/api";

const STEP_LABELS: Record<string, { title: string; desc: string }> = {
  generating: { title: "Generating problem", desc: "Crafting statement, constraints, and examples" },
  schema_validating: { title: "Schema validation", desc: "Checking required fields and types" },
  llm_validating: { title: "Content validation", desc: "Reviewing problem quality" },
  patching: { title: "Patching issues", desc: "Fixing validation errors" },
  final_validating: { title: "Final validation", desc: "Verifying patched output" },
  verifying: { title: "Verifying solution", desc: "Running reference solution against all tests" },
  storing: { title: "Saving problem", desc: "Storing to your local problem library" }
};

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
  const [currentStepLabel, setCurrentStepLabel] = useState<string>("generating");
  const [patchIssues, setPatchIssues] = useState<string[]>([]);
  const [generated, setGenerated] = useState<ProblemDetail | null>(null);
  const [recent, setRecent] = useState<RecentGen[]>([]);
  const [partialProblem, setPartialProblem] = useState<Record<string, unknown> | null>(null);
  const navigate = useNavigate();

  const stepOrder: string[] = ["generating", "schema_validating", "llm_validating", "verifying", "storing"];

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

  const onGenerate = async () => {
    if (!input.trim() || input.trim().length < 2) return;
    setLoading(true);
    setError(null);
    setGenerated(null);
    setPartialProblem(null);
    setActiveStep(0);
    setProgress(0);
    setPatchIssues([]);
    setCurrentStepLabel("generating");

    try {
      await api.generateProblemStream(
        { input, isCustomProblem },
        (event) => {
          if (event.type === "progress") {
            const step = event.data.step;
            if (step) {
              const idx = stepOrder.indexOf(step);
              if (idx !== -1) {
                setActiveStep(idx);
                setCurrentStepLabel(step);
                setProgress(((idx + 1) / stepOrder.length) * 100);
              }
            }
            if (event.data.issues) {
              setPatchIssues(event.data.issues);
            } else {
              setPatchIssues([]);
            }
            if (event.data.partialProblem) {
              setPartialProblem(event.data.partialProblem);
            }
          }

          if (event.type === "complete") {
            setProgress(100);
            setActiveStep(stepOrder.length - 1);
            setGenerated(event.data as unknown as ProblemDetail);
          }

          if (event.type === "error") {
            setError(event.data.message ?? "Generation failed");
          }
        }
      );
    } catch (err) {
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
    setPartialProblem(null);
    setActiveStep(0);
    setProgress(0);
    setError(null);
    setPatchIssues([]);
    setCurrentStepLabel("generating");
  };

  const onRecentClick = (id: number) => {
    navigate(`/solve?problemId=${id}`);
  };

  return (
    <div className="animate-in">
      <div className="mb-6">
        <h2 className="font-serif text-2xl tracking-[-0.02em] text-[var(--text)] mb-2">Generate Problem</h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-md leading-relaxed">
          Enter a DSA concept or describe a custom problem. Watch as the AI generates it in real time.
        </p>
      </div>

      {!generated && !loading && (
        <div className="card mb-6">
          <div className="space-y-5">
            <div>
              <label className="section-label mb-3 block">Concept or prompt</label>
              <textarea
                className="textarea"
                rows={6}
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
              className="btn btn-primary btn-lg centered-btn"
            >
              Generate
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="generation-layout">
          <div className="generation-sidebar">
            <div className="card">
              <div className="flex items-center gap-3 mb-5">
                <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                <span className="text-sm text-[var(--text-secondary)]">Generating...</span>
              </div>

              <div className="progress-steps">
                {stepOrder.map((stepKey, idx) => {
                  const step = STEP_LABELS[stepKey];
                  const isDone = idx < activeStep;
                  const isActive = idx === activeStep;

                  return (
                    <div
                      key={stepKey}
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

              <div className="progress-bar mt-5">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>

              {patchIssues.length > 0 && (
                <div className="validation-issues mt-4">
                  <div className="section-label mb-2">Validation issues</div>
                  {patchIssues.map((issue, i) => (
                    <div key={i} className="validation-issue">{issue}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <LivePreview problem={partialProblem} currentStep={currentStepLabel} />
          </div>
        </div>
      )}

      {generated && (
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

      {!generated && !loading && recent.length > 0 && (
        <div className="mt-6">
          <h3 className="section-label mb-3">Recent problems</h3>
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
    </div>
  );
}

function LivePreview({ problem, currentStep }: { problem: Record<string, unknown> | null; currentStep: string }) {
  if (!problem) {
    return (
      <div className="live-preview">
        <div className="live-preview-header">
          <span className="live-preview-title">Live Preview</span>
          <span className="live-preview-badge">
            <div className="typing-indicator">
              <span /><span /><span />
            </div>
            Waiting for output
          </span>
        </div>
        <div className="live-preview-body">
          <div className="empty-state" style={{ padding: "40px 0" }}>
            <p>The generated problem will appear here in real time.</p>
          </div>
        </div>
      </div>
    );
  }

  const title = (problem.title as string) ?? "";
  const statement = (problem.statement as string) ?? "";
  const constraints = (problem.constraints as string[]) ?? [];
  const examples = (problem.examples as Array<{ input: string; output: string; explanation?: string }>) ?? [];
  const tests = (problem.publicTests as Array<{ input: string; expectedOutput: string }>) ?? [];
  const functionSignature = (problem.functionSignature as string) ?? "";
  const expectedComplexity = (problem.expectedComplexity as string) ?? "";
  const difficulty = (problem.difficulty as string) ?? "";
  const tags = (problem.tags as string[]) ?? [];

  const showStatement = currentStep !== "generating";

  return (
    <div className="live-preview animate-in">
      <div className="live-preview-header">
        <span className="live-preview-title">Live Preview</span>
        <span className="live-preview-badge">
          <div className="typing-indicator">
            <span /><span /><span />
          </div>
          {STEP_LABELS[currentStep]?.title ?? currentStep}
        </span>
      </div>

      <div className="live-preview-body">
        {title && (
          <div className={`live-section ${showStatement ? "visible" : ""}`}>
            <div className="live-section-title">{title}</div>
            {(difficulty || tags.length > 0) && (
              <div className="live-section-meta">
                {difficulty && <span className={`badge badge-${difficulty}`}>{difficulty}</span>}
                {tags.map((tag) => (
                  <span key={tag} className="badge badge-tag">{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {statement && showStatement && (
          <div className="live-section visible">
            <div className="live-section-label">
              <span className="dot" />
              Problem Statement
            </div>
            <div className="live-statement">{statement}</div>
          </div>
        )}

        {constraints.length > 0 && showStatement && (
          <div className="live-section visible">
            <div className="live-section-label">
              <span className="dot" />
              Constraints
            </div>
            <ul className="live-constraints">
              {constraints.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        {examples.length > 0 && showStatement && (
          <div className="live-section visible">
            <div className="live-section-label">
              <span className="dot" />
              Examples
            </div>
            {examples.map((ex, idx) => (
              <div key={idx} className="live-example">
                <div className="live-example-label">Example {idx + 1}</div>
                <div className="live-example-row"><span>Input: </span>{ex.input}</div>
                <div className="live-example-row"><span>Output: </span>{ex.output}</div>
                {ex.explanation && (
                  <div className="live-example-row" style={{ marginTop: 4, opacity: 0.6 }}>
                    {ex.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tests.length > 0 && showStatement && (
          <div className="live-section visible">
            <div className="live-section-label">
              <span className="dot" />
              Test Cases
            </div>
            <div className="live-tests">
              {tests.slice(0, 6).map((test, idx) => (
                <div key={idx} className="live-test-item">
                  <div className="live-test-icon pass">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" strokeWidth="3">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-mono text-xs text-[var(--text-secondary)]">
                    {test.input}
                  </span>
                  <span className="ml-auto text-[var(--text-tertiary)]">→</span>
                  <span className="font-mono text-xs text-[var(--success)]">
                    {test.expectedOutput}
                  </span>
                </div>
              ))}
              {tests.length > 6 && (
                <div className="text-xs text-[var(--text-tertiary)] text-center py-1">
                  +{tests.length - 6} more cases
                </div>
              )}
            </div>
          </div>
        )}

        {functionSignature && showStatement && (
          <div className="live-section visible">
            <div className="live-section-label">
              <span className="dot" />
              Starter Code
            </div>
            <div className="live-code">{functionSignature}</div>
          </div>
        )}

        {expectedComplexity && showStatement && (
          <div className="live-section visible">
            <div className="live-section-label">
              <span className="dot" />
              Complexity Target
            </div>
            <div className="live-complexity">{expectedComplexity}</div>
          </div>
        )}

        {!title && (
          <div className="flex items-center justify-center py-12">
            <div className="typing-indicator">
              <span /><span /><span />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
