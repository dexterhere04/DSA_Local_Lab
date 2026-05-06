import { useEffect, useState } from "react";
import { api } from "../services/api";

interface SubmissionRow {
  id: number;
  title: string;
  mode: string;
  status: string;
  passedCount: number;
  totalCount: number;
  runtimeMs: number;
  memoryKb: number;
}

export function SubmissionHistoryPage() {
  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listSubmissions()
      .then((data) => setRows(data as unknown as SubmissionRow[]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-in">
      <div className="mb-8">
        <h2 className="font-serif text-2xl tracking-[-0.02em] text-[var(--text)] mb-2">Submission History</h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-md leading-relaxed">
          Track your past attempts and performance metrics.
        </p>
      </div>

      {loading ? (
        <div className="card">
          <div className="flex items-center gap-3 text-sm text-[var(--text-tertiary)]">
            <div className="spinner" />
            Loading...
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div className="card empty-state">
          <p>No submissions yet.</p>
        </div>
      ) : (
        <div className="card !p-0">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Problem</th>
                  <th>Mode</th>
                  <th>Status</th>
                  <th>Tests</th>
                  <th>Runtime</th>
                  <th>Memory</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="text-[var(--text)] font-medium">{row.title || "-"}</td>
                    <td>
                      <span className={`badge ${row.mode === "submit" ? "badge-medium" : "badge-tag"}`}>
                        {row.mode}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${row.status === "accepted" ? "badge-accepted" : "badge-failed"}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>
                      <span className="text-[var(--text)]">{row.passedCount}</span>
                      <span className="text-[var(--text-tertiary)]"> / {row.totalCount}</span>
                    </td>
                    <td className="font-mono text-xs">{row.runtimeMs ?? 0}ms</td>
                    <td className="font-mono text-xs">{row.memoryKb ?? 0}KB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
