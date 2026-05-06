import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

interface Topic {
  topic: string;
  count: number;
}

export function TopicExplorerPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .listTopics()
      .then((data) => setTopics(data))
      .finally(() => setLoading(false));
  }, []);

  const handleTopicClick = (topic: string) => {
    navigate(`/generate`, { state: { topic } });
  };

  return (
    <div className="animate-in">
      <div className="mb-8">
        <h2 className="font-serif text-2xl tracking-[-0.02em] text-[var(--text)] mb-2">Topics</h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-md leading-relaxed">
          Browse problem categories and generate focused practice sets.
        </p>
      </div>

      {loading ? (
        <div className="card">
          <div className="flex items-center gap-3 text-sm text-[var(--text-tertiary)]">
            <div className="spinner" />
            Loading...
          </div>
        </div>
      ) : topics.length === 0 ? (
        <div className="card empty-state">
          <p>No topics tracked yet. Generate problems to populate this view.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic, idx) => (
            <div
              key={topic.topic}
              className="topic-card animate-in"
              style={{ animationDelay: `${idx * 0.03}s` }}
              onClick={() => handleTopicClick(topic.topic)}
            >
              <h3>{topic.topic}</h3>
              <span>
                {topic.count} {topic.count === 1 ? "problem" : "problems"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
