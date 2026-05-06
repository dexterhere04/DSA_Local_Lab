export type Difficulty = "easy" | "medium" | "hard";

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  explanation?: string;
  isHidden: boolean;
  weight?: number;
}

export interface GeneratedProblem {
  title: string;
  statement: string;
  constraints: string[];
  examples: ProblemExample[];
  edgeCases: string[];
  publicTests: TestCase[];
  hiddenTests: TestCase[];
  hints: string[];
  functionSignature: string;
  starterCode: string;
  expectedComplexity: string;
  difficulty: Difficulty;
  tags: string[];
  solutionOutline: string;
}

export interface ValidationIssue {
  field: string;
  problem: string;
  minimal_fix: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export interface JudgeCaseResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  runtimeMs?: number;
  memoryKb?: number;
  error?: string;
  hidden: boolean;
}
