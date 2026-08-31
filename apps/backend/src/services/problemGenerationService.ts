import { aiProvider } from "./aiProvider.js";
import {
  llmValidationPrompt,
  patchPrompt,
  problemGenerationPrompt,
  schemaValidationPrompt,
  verificationPatchPrompt
} from "./promptTemplates.js";
import { buildDefaultJavaStarter } from "./javaTemplate.js";
import { localJavaExecutionService } from "./localJavaExecutionService.js";
import type { GeneratedProblem, ValidationResult, Verdict } from "../types.js";
import { z } from "zod";

const generatedProblemSchema = z.object({
  title: z.string(),
  statement: z.string(),
  constraints: z.array(z.string()),
  examples: z.array(
    z.object({
      input: z.string(),
      output: z.string(),
      explanation: z.string().optional()
    })
  ),
  edgeCases: z.array(z.string()),
  publicTests: z.array(
    z.object({
      input: z.string(),
      expectedOutput: z.string(),
      explanation: z.string().optional(),
      isHidden: z.boolean(),
      weight: z.number().optional()
    })
  ),
  hiddenTests: z.array(
    z.object({
      input: z.string(),
      expectedOutput: z.string(),
      explanation: z.string().optional(),
      isHidden: z.boolean(),
      weight: z.number().optional()
    })
  ),
  hints: z.array(z.string()),
  functionSignature: z.string(),
  starterCode: z.string(),
  expectedComplexity: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  tags: z.array(z.string()),
  solutionOutline: z.string().default(""),
  referenceSolution: z.string().default(""),
  timeLimitMs: z.coerce.number().int().positive().default(2000),
  memoryLimitMb: z.coerce.number().int().positive().default(256)
});

export type GenerationStepName =
  | "generating"
  | "schema_validating"
  | "llm_validating"
  | "patching"
  | "final_validating"
  | "verifying"
  | "storing";

export type GenerationProgress = {
  step: GenerationStepName;
  issues?: string[];
  callCount: number;
  partialProblem?: Record<string, unknown>;
};

interface VerificationFailure {
  kind: "public" | "hidden";
  index: number;
  verdict: Verdict;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  error?: string;
}

const VERDICT_LABELS: Record<Verdict, string> = {
  AC: "Accepted",
  WA: "Wrong Answer",
  TLE: "Time Limit Exceeded",
  MLE: "Memory Limit Exceeded",
  RE: "Runtime Error",
  CE: "Compilation Error"
};

const MAX_VERIFY_RETRIES = 3;

const formatFailureUser = (f: VerificationFailure) =>
  `${f.kind === "hidden" ? "Hidden" : "Public"} test #${f.index + 1}: ${
    VERDICT_LABELS[f.verdict] ?? f.verdict
  }`;

const formatFailurePatch = (f: VerificationFailure) =>
  `${f.kind} test #${f.index + 1} [${f.verdict}]: input=${JSON.stringify(f.input)} expected=${JSON.stringify(
    f.expectedOutput
  )} actual=${JSON.stringify(f.actualOutput ?? "")} error=${JSON.stringify(f.error ?? "")}`;

export class ProblemGenerationService {
  private schemaValidate(json: Record<string, unknown>): ValidationResult {
    try {
      generatedProblemSchema.parse(json);
      return { valid: true, issues: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          issues: error.errors.map((e) => ({
            field: e.path.join("."),
            problem: e.message,
            minimal_fix: `Set ${e.path.join(".")} to valid ${e.code}`
          }))
        };
      }
      return { valid: false, issues: [{ field: "unknown", problem: "Validation failed", minimal_fix: "Check schema" }] };
    }
  }

  private async llmValidate(json: Record<string, unknown>): Promise<ValidationResult> {
    const prompt = llmValidationPrompt(JSON.stringify(json, null, 2));
    return aiProvider.validateContent(prompt);
  }

  private async patch(
    originalJson: Record<string, unknown>,
    issues: ValidationResult["issues"]
  ): Promise<Record<string, unknown>> {
    const issuesText = issues.map((i) => `- ${i.field}: ${i.problem} → ${i.minimal_fix}`).join("\n");
    return aiProvider.patchProblem(JSON.stringify(originalJson, null, 2), issuesText);
  }

  private async patchForVerification(
    originalJson: Record<string, unknown>,
    failures: VerificationFailure[]
  ): Promise<Record<string, unknown>> {
    const failuresText = failures.map(formatFailurePatch).join("\n");
    return aiProvider.completeJson([
      {
        role: "system",
        content: "You fix DSA problem JSON. Return ONLY the corrected full JSON. No explanations."
      },
      { role: "user", content: verificationPatchPrompt(JSON.stringify(originalJson, null, 2), failuresText) }
    ]);
  }

  private async verifyReference(problem: GeneratedProblem): Promise<VerificationFailure[]> {
    if (!problem.referenceSolution?.trim()) {
      return [
        {
          kind: "public",
          index: -1,
          verdict: "CE",
          input: "",
          expectedOutput: "",
          error: "referenceSolution is empty"
        }
      ];
    }

    const tests: Array<{ kind: "public" | "hidden"; index: number; input: string; expectedOutput: string; isHidden: boolean }> = [
      ...problem.publicTests.map((t, i) => ({ kind: "public" as const, index: i, input: t.input, expectedOutput: t.expectedOutput, isHidden: t.isHidden })),
      ...problem.hiddenTests.map((t, i) => ({ kind: "hidden" as const, index: i, input: t.input, expectedOutput: t.expectedOutput, isHidden: t.isHidden }))
    ];

    const failures: VerificationFailure[] = [];
    for (const test of tests) {
      const result = await localJavaExecutionService.runCase(
        problem.referenceSolution,
        test.input,
        test.expectedOutput,
        test.isHidden,
        { timeLimitMs: problem.timeLimitMs, memoryLimitMb: problem.memoryLimitMb }
      );
      if (result.verdict !== "AC") {
        failures.push({
          kind: test.kind,
          index: test.index,
          verdict: result.verdict,
          input: test.input,
          expectedOutput: test.expectedOutput,
          actualOutput: result.actualOutput,
          error: result.error
        });
      }
    }
    return failures;
  }

  private ensureJavaCorrectness(problem: GeneratedProblem): GeneratedProblem {
    if (!problem.functionSignature?.includes("solve")) {
      problem.functionSignature = "public Object solve(String input)";
    }
    const hasProperCode =
      problem.starterCode?.includes("class Solution") &&
      problem.starterCode?.includes("solve") &&
      problem.starterCode?.includes("\n") &&
      problem.starterCode?.includes("// TODO");
    if (!hasProperCode) {
      problem.starterCode = buildDefaultJavaStarter(problem.functionSignature);
    }
    return problem;
  }

  async *generateFromInput(
    input: string,
    isCustomProblem: boolean
  ): AsyncGenerator<GenerationProgress, GeneratedProblem> {
    let callCount = 0;
    let currentJson: Record<string, unknown> = {};

    // Step 1: Generate
    yield { step: "generating", callCount };
    currentJson = await aiProvider.completeJson([
      {
        role: "system",
        content: "You generate DSA problems. Return strict JSON only."
      },
      {
        role: "user",
        content: problemGenerationPrompt({ conceptOrPrompt: input, isCustomProblem })
      }
    ]);
    callCount++;

    // Step 2: Schema validate
    yield { step: "schema_validating", callCount, partialProblem: { ...currentJson } };
    let schemaResult = this.schemaValidate(currentJson);

    // Step 3: Patch if schema invalid
    if (!schemaResult.valid) {
      yield {
        step: "patching",
        issues: schemaResult.issues.map((i) => i.field),
        callCount,
        partialProblem: { ...currentJson }
      };
      currentJson = await this.patch(currentJson, schemaResult.issues);
      callCount++;

      // Final schema validate
      yield { step: "final_validating", callCount, partialProblem: { ...currentJson } };
      schemaResult = this.schemaValidate(currentJson);
      if (!schemaResult.valid) {
        throw new Error(`Schema validation failed after patch: ${JSON.stringify(schemaResult.issues)}`);
      }
    }

    // Step 4: LLM validate
    yield { step: "llm_validating", callCount, partialProblem: { ...currentJson } };
    const llmResult = await this.llmValidate(currentJson);
    callCount++;

    // Step 5: Patch if LLM validation found issues
    if (!llmResult.valid) {
      yield {
        step: "patching",
        issues: llmResult.issues.map((i) => i.field),
        callCount,
        partialProblem: { ...currentJson }
      };
      currentJson = await this.patch(currentJson, llmResult.issues);
      callCount++;

      // Final schema validate after LLM patch
      yield { step: "final_validating", callCount, partialProblem: { ...currentJson } };
      const finalSchemaResult = this.schemaValidate(currentJson);
      if (!finalSchemaResult.valid) {
        throw new Error(`Schema validation failed after LLM patch: ${JSON.stringify(finalSchemaResult.issues)}`);
      }
    }

    // Step 6: Verify reference solution against all tests (with auto-patch retry)
    let problem = this.ensureJavaCorrectness(generatedProblemSchema.parse(currentJson) as GeneratedProblem);

    for (let attempt = 0; attempt <= MAX_VERIFY_RETRIES; attempt++) {
      yield { step: "verifying", callCount, partialProblem: { ...currentJson } };
      const failures = await this.verifyReference(problem);

      if (failures.length === 0) {
        break;
      }

      if (attempt === MAX_VERIFY_RETRIES) {
        throw new Error(`Verification failed: ${formatFailureUser(failures[0])}`);
      }

      yield {
        step: "patching",
        issues: failures.map(formatFailureUser),
        callCount,
        partialProblem: { ...currentJson }
      };

      currentJson = await this.patchForVerification(currentJson, failures);
      callCount++;

      const verifySchemaResult = this.schemaValidate(currentJson);
      if (!verifySchemaResult.valid) {
        throw new Error(`Schema validation failed after verification patch: ${JSON.stringify(verifySchemaResult.issues)}`);
      }

      problem = this.ensureJavaCorrectness(generatedProblemSchema.parse(currentJson) as GeneratedProblem);
    }

    // Step 7: Store (return parsed problem)
    yield { step: "storing", callCount, partialProblem: { ...currentJson } };
    return problem;
  }

  async verifyProblem(problem: GeneratedProblem): Promise<string[]> {
    const failures = await this.verifyReference(problem);
    return failures.map(formatFailureUser);
  }

  async generateMoreTests(problemStatement: string) {
    return aiProvider.completeJson([
      {
        role: "system",
        content: "Generate deterministic, high-signal test cases. Return strict JSON only."
      },
      {
        role: "user",
        content: `Problem:\n${problemStatement}\n\nReturn: {"publicTests":[],"hiddenTests":[]}`
      }
    ]);
  }

  async generateHints(problemStatement: string) {
    return aiProvider.completeJson([
      {
        role: "system",
        content: "Generate progressive hints. Return strict JSON only."
      },
      {
        role: "user",
        content: `Problem:\n${problemStatement}\n\nReturn: {"hints":["Hint 1","Hint 2","Hint 3","Hint 4"]}`
      }
    ]);
  }

  async generateSolutionOutline(problemStatement: string) {
    return aiProvider.completeJson([
      {
        role: "system",
        content: "Return strict JSON only."
      },
      {
        role: "user",
        content: `Problem:\n${problemStatement}\n\nReturn: {"solutionOutline":"","expectedComplexity":""}`
      }
    ]);
  }
}

export const problemGenerationService = new ProblemGenerationService();
