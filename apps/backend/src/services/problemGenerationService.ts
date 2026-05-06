import { aiProvider } from "./aiProvider.js";
import {
  llmValidationPrompt,
  patchPrompt,
  problemGenerationPrompt,
  schemaValidationPrompt
} from "./promptTemplates.js";
import { buildDefaultJavaStarter } from "./javaTemplate.js";
import type { GeneratedProblem, ValidationResult } from "../types.js";
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
  solutionOutline: z.string().default("")
});

export type GenerationStepName =
  | "generating"
  | "schema_validating"
  | "llm_validating"
  | "patching"
  | "final_validating"
  | "storing";

export type GenerationProgress = {
  step: GenerationStepName;
  issues?: string[];
  callCount: number;
  partialProblem?: Record<string, unknown>;
};

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

    // Step 6: Store (return parsed problem)
    yield { step: "storing", callCount, partialProblem: { ...currentJson } };
    const problem = generatedProblemSchema.parse(currentJson) as GeneratedProblem;
    return this.ensureJavaCorrectness(problem);
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
