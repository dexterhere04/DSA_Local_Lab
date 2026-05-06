import { useEffect, useState } from "react";
import { api } from "../services/api";

export function SubmissionHistoryPage() {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    api.listSubmissions().then(setRows);
  }, []);

  return (
    <section className="panel p-5">
      <h1 className="mb-4 text-2xl font-semibold">Submission History</h1>
      <div className="overflow-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="text-slate-400">
              <th className="pb-2">Problem</th>
              <th className="pb-2">Mode</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Pass</th>
              <th className="pb-2">Runtime</th>
              <th className="pb-2">Memory</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row.id)} className="border-t border-slate-800 text-slate-200">
                <td className="py-2">{String(row.title ?? "-")}</td>
                <td className="py-2">{String(row.mode ?? "-")}</td>
                <td className="py-2">{String(row.status ?? "-")}</td>
                <td className="py-2">
                  {String(row.passedCount ?? 0)}/{String(row.totalCount ?? 0)}
                </td>
                <td className="py-2">{String(row.runtimeMs ?? 0)} ms</td>
                <td className="py-2">{String(row.memoryKb ?? 0)} KB</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? <p className="mt-3 text-sm text-slate-400">No submissions yet.</p> : null}
    </section>
  );
}
