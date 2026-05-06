import { aiProvider } from "./aiProvider.js";
import {
  hintGenerationPrompt,
  problemGenerationPrompt,
  solutionGenerationPrompt,
  testcaseGenerationPrompt
} from "./promptTemplates.js";
import { buildDefaultJavaStarter } from "./javaTemplate.js";
import type { GeneratedProblem } from "../types.js";
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

export class ProblemGenerationService {
  async generateFromInput(input: string, isCustomProblem: boolean): Promise<GeneratedProblem> {
    const generatedJson = await aiProvider.completeJson([
      {
        role: "system",
        content:
          "You generate algorithmic coding problems for local DSA training. Return strict JSON and nothing else."
      },
      {
        role: "user",
        content: problemGenerationPrompt({ conceptOrPrompt: input, isCustomProblem })
      }
    ]);

    const generated = generatedProblemSchema.parse(generatedJson) as GeneratedProblem;

    // Ensure functionSignature and starterCode are correct
    if (!generated.functionSignature?.includes("solve")) {
      generated.functionSignature = "public Object solve(String input)";
    }

    if (!generated.starterCode?.includes("class Solution") || !generated.starterCode?.includes("solve")) {
      generated.starterCode = buildDefaultJavaStarter(generated.functionSignature);
    }

    return generated;
  }

  async generateMoreTests(problemStatement: string) {
    return aiProvider.completeJson([
      {
        role: "system",
        content: "Generate deterministic, high-signal test cases. Return strict JSON only."
      },
      {
        role: "user",
        content: testcaseGenerationPrompt(problemStatement)
      }
    ]);
  }

  async generateHints(problemStatement: string) {
    return aiProvider.completeJson([
      {
        role: "system",
        content: "Generate progressive hints from conceptual to optimization level."
      },
      {
        role: "user",
        content: hintGenerationPrompt(problemStatement)
      }
    ]);
  }

  async generateSolutionOutline(problemStatement: string) {
    return aiProvider.completeJson([
      {
        role: "system",
        content: "Generate concise optimized solution outline and complexity details."
      },
      {
        role: "user",
        content: solutionGenerationPrompt(problemStatement)
      }
    ]);
  }
}

export const problemGenerationService = new ProblemGenerationService();
