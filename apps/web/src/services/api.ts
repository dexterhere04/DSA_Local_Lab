import type { ProblemDetail, ProblemListItem, SubmissionResponse } from "@dsa-lab/shared";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

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

export const api = {
  listProblems: () => request<ProblemListItem[]>("/problems"),
  getProblem: (id: number) => request<ProblemDetail>(`/problems/${id}`),
  generateProblem: (payload: { input: string; isCustomProblem: boolean }) =>
    request<ProblemDetail>("/problems/generate", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  runSubmission: (payload: { problemId: number; code: string; mode: "run" | "submit" }) =>
    request<SubmissionResponse>("/submissions", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  listSubmissions: () => request<Array<Record<string, unknown>>>("/submissions"),
  listTopics: () => request<Array<{ topic: string; count: number }>>("/topics"),
  listProblemSets: () => request<Array<Record<string, unknown>>>("/problem-sets")
};
