import { useEffect, useState } from "react";
import { api } from "../services/api";

export function TopicExplorerPage() {
  const [topics, setTopics] = useState<Array<{ topic: string; count: number }>>([]);

  useEffect(() => {
    api.listTopics().then(setTopics);
  }, []);

  return (
    <section className="panel p-5">
      <h1 className="mb-4 text-2xl font-semibold">Topic Explorer</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic) => (
          <div key={topic.topic} className="rounded-lg border border-slate-700 bg-slate-900/70 p-4">
            <p className="text-base font-semibold text-slate-100">{topic.topic}</p>
            <p className="text-sm text-slate-400">{topic.count} problems</p>
          </div>
        ))}
      </div>
      {topics.length === 0 ? <p className="text-sm text-slate-400">No topics tracked yet.</p> : null}
    </section>
  );
}
