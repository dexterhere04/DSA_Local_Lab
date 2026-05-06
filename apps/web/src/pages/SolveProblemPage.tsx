import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { ProblemDetail, ProblemListItem, SubmissionResponse } from "@dsa-lab/shared";
import { api } from "../services/api";
import { ProblemPanel } from "../components/ProblemPanel";
import { EditorPanel } from "../components/EditorPanel";
import { TestResultPanel } from "../components/TestResultPanel";

const MIN_LEFT_WIDTH = 320;
const MIN_RIGHT_WIDTH = 400;
const MIN_EDITOR_HEIGHT = 200;
const DEFAULT_CONSOLE_HEIGHT = 220;

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
    if (!selectedProblemId) return;

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
    if (!problem) return;
    setLoading(true);
    setError(null);
    try {
      const payload = await api.runSubmission({ problemId: problem.id, code, mode });
      setResult(payload);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const workspaceRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState(50);
  const [consoleHeight, setConsoleHeight] = useState(DEFAULT_CONSOLE_HEIGHT);
  const resizing = useRef<"split" | "console" | null>(null);

  const onPointerDown = useCallback((type: "split" | "console") => (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    resizing.current = type;
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!resizing.current || !workspaceRef.current) return;

    if (resizing.current === "split") {
      const rect = workspaceRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const total = rect.width;
      const pct = (x / total) * 100;
      const leftPx = (pct / 100) * total;
      const rightPx = total - leftPx;
      if (leftPx >= MIN_LEFT_WIDTH && rightPx >= MIN_RIGHT_WIDTH) {
        setLeftWidth(pct);
      }
    }

    if (resizing.current === "console") {
      const rect = workspaceRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const bottomEdge = rect.bottom - y;
      if (bottomEdge >= 160 && bottomEdge <= rect.height - MIN_EDITOR_HEIGHT) {
        setConsoleHeight(bottomEdge);
      }
    }
  }, []);

  const onPointerUp = useCallback(() => {
    resizing.current = null;
  }, []);

  const leftStyle = { width: `${leftWidth}%` };
  const rightStyle = { width: `${100 - leftWidth}%` };
  const rightContentStyle = {
    display: "flex",
    flexDirection: "column" as const,
    height: "100%"
  };
  const editorStyle = { flex: 1, minHeight: MIN_EDITOR_HEIGHT, overflow: "hidden" };
  const consoleStyle = { height: consoleHeight, flexShrink: 0 };

  return (
    <div
      ref={workspaceRef}
      className="workspace"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="workspace-pane workspace-pane-left" style={leftStyle}>
        <div className="problem-header">
          <div className="flex items-center justify-between gap-3 mb-2">
            {problemList.length > 0 && (
              <select
                className="problem-select"
                value={selectedProblemId || ""}
                onChange={(e) => setSearchParams({ problemId: e.target.value })}
              >
                {problemList.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            )}
          </div>
          {problem && (
            <>
              <h2>{problem.title}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className={`badge badge-${problem.difficulty}`}>{problem.difficulty}</span>
                {problem.tags.map((tag) => (
                  <span key={tag} className="badge badge-tag">{tag}</span>
                ))}
              </div>
            </>
          )}
        </div>

        {problem ? (
          <div className="problem-body">
            <ProblemPanel problem={problem} compact />
          </div>
        ) : (
          <div className="problem-body">
            <div className="empty-state">
              <p>Select a problem to begin.</p>
            </div>
          </div>
        )}
      </div>

      <div
        className={`workspace-divider ${resizing.current === "split" ? "active" : ""}`}
        onPointerDown={onPointerDown("split")}
      />

      <div className="workspace-pane workspace-pane-right" style={rightStyle}>
        <div style={rightContentStyle}>
          <div className="editor-header">
            <span>Solution.java</span>
          </div>

          <div style={editorStyle}>
            <EditorPanel code={code} onChange={setCode} />
          </div>

          <div className="action-bar">
            {error && <span className="text-xs text-[var(--error)]">{error}</span>}
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => execute("run")}
                disabled={loading}
                className="btn btn-secondary btn-sm"
              >
                {loading ? <div className="spinner" /> : null}
                Run
              </button>
              <button
                onClick={() => execute("submit")}
                disabled={loading}
                className="btn btn-primary btn-sm"
              >
                {loading ? <div className="spinner" /> : null}
                Submit
              </button>
            </div>
          </div>

          <div
            className="test-console"
            style={consoleStyle}
          >
            <div
              className="test-console-header"
              onPointerDown={onPointerDown("console")}
            >
              <h3>Test Console</h3>
              <div className="flex items-center gap-3">
                {result && (
                  <>
                    <span className={`badge ${result.status === "accepted" ? "badge-accepted" : "badge-failed"}`}>
                      {result.status}
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {result.passedCount}/{result.totalCount}
                    </span>
                    <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
                      {result.runtimeMs ?? 0}ms · {result.memoryKb ?? 0}KB
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="test-console-body">
              <TestResultPanel result={result} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
