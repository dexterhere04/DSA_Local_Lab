export type Difficulty = "easy" | "medium" | "hard";

export interface ProblemListItem {
  id: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  tags: string[];
  createdAt: string;
}

export interface ProblemDetail extends ProblemListItem {
  sourceType: "ai_generated" | "custom";
  sourceInput: string;
  statement: string;
  constraints: string[];
  examples: Array<{ input: string; output: string; explanation?: string }>;
  edgeCases: string[];
  hints: string[];
  functionSignature: string;
  starterCode: string;
  expectedComplexity: string;
  publicTests: Array<{ id: number; input: string; expectedOutput: string; explanation?: string; isHidden: boolean }>;
}

export interface SubmissionResponse {
  submissionId: number;
  status: string;
  passedCount: number;
  totalCount: number;
  runtimeMs?: number;
  memoryKb?: number;
  results: Array<{
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
    runtimeMs?: number;
    memoryKb?: number;
    error?: string;
    hidden: boolean;
  }>;
}
