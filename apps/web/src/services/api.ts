import type { ProblemDetail, ProblemListItem, SubmissionResponse } from "@dsa-lab/shared";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

interface ProgressEvent {
  type: "progress" | "complete" | "error";
  data: {
    step?: string;
    issues?: string[];
    callCount?: number;
    partialProblem?: Record<string, unknown>;
    message?: string;
  };
}

async function streamGenerate(
  payload: { input: string; isCustomProblem: boolean },
  onProgress: (event: ProgressEvent) => void
): Promise<void> {
  const response = await fetch(`${API_BASE}/problems/generate/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }

  if (!response.body) {
    throw new Error("No response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const dataStr = trimmed.slice(6);
        if (dataStr === "[DONE]") return;

        try {
          const event = JSON.parse(dataStr) as ProgressEvent;
          onProgress(event);
        } catch {
          // skip malformed lines
        }
      }
    }

    // Process remaining buffer
    const trimmed = buffer.trim();
    if (trimmed.startsWith("data: ")) {
      const dataStr = trimmed.slice(6);
      if (dataStr !== "[DONE]") {
        try {
          const event = JSON.parse(dataStr) as ProgressEvent;
          onProgress(event);
        } catch {
          // skip
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export interface SettingsState {
  openaiBaseUrl: string;
  openaiModel: string;
  hasApiKey: boolean;
  javaBin: string;
  javacBin: string;
  executionTimeoutMs: number;
}

export interface HealthState {
  ok: boolean;
  java: { available: boolean; version?: string };
}

export const api = {
  listProblems: () => request<ProblemListItem[]>("/problems"),
  getProblem: (id: number) => request<ProblemDetail>(`/problems/${id}`),
  generateProblem: (payload: { input: string; isCustomProblem: boolean }) =>
    request<ProblemDetail>("/problems/generate", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  generateProblemStream: streamGenerate,
  runSubmission: (payload: { problemId: number; code: string; mode: "run" | "submit" }) =>
    request<SubmissionResponse>("/submissions", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  listSubmissions: () => request<Array<Record<string, unknown>>>("/submissions"),
  listTopics: () => request<Array<{ topic: string; count: number }>>("/topics"),
  listProblemSets: () => request<Array<Record<string, unknown>>>("/problem-sets"),
  getSettings: () => request<SettingsState>("/settings"),
  updateSettings: (payload: Partial<SettingsState> & { openaiApiKey?: string }) =>
    request<SettingsState>("/settings", {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  getHealth: () => request<HealthState>("/health")
};
