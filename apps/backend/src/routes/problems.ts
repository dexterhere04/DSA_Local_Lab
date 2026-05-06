import { FastifyInstance } from "fastify";
import { z } from "zod";
import { problemGenerationService } from "../services/problemGenerationService.js";
import { problemService } from "../services/problemService.js";
import { buildLocalTestRunner } from "../services/javaTemplate.js";

const generateBody = z.object({
  input: z.string().min(2),
  isCustomProblem: z.boolean().default(false)
});

const saveCustomBody = z.object({
  title: z.string().min(2),
  statement: z.string().min(10),
  constraints: z.array(z.string()).default([]),
  examples: z.array(
    z.object({
      input: z.string(),
      output: z.string(),
      explanation: z.string().optional()
    })
  ),
  edgeCases: z.array(z.string()).default([]),
  publicTests: z.array(
    z.object({
      input: z.string(),
      expectedOutput: z.string(),
      explanation: z.string().optional(),
      isHidden: z.literal(false)
    })
  ),
  hiddenTests: z.array(
    z.object({
      input: z.string(),
      expectedOutput: z.string(),
      explanation: z.string().optional(),
      isHidden: z.literal(true)
    })
  ),
  hints: z.array(z.string()).default([]),
  functionSignature: z.string(),
  starterCode: z.string(),
  expectedComplexity: z.string(),
  solutionOutline: z.string().default(""),
  difficulty: z.enum(["easy", "medium", "hard"]),
  tags: z.array(z.string()).default([]),
  sourceInput: z.string().default("manual")
});

export async function problemRoutes(app: FastifyInstance) {
  app.get("/problems", async () => problemService.listProblems());

  app.get<{ Params: { id: string } }>("/problems/:id", async (request, reply) => {
    const problem = await problemService.getProblemById(Number(request.params.id));
    if (!problem) {
      return reply.status(404).send({ message: "Problem not found" });
    }
    return problem;
  });

  app.get<{ Params: { id: string } }>("/problems/:id/java-template", async (request, reply) => {
    const problem = await problemService.getProblemById(Number(request.params.id));
    if (!problem) {
      return reply.status(404).send({ message: "Problem not found" });
    }

    const sample = problem.publicTests[0] ?? {
      input: "",
      expectedOutput: ""
    };

    return {
      files: {
        "Solution.java": problem.starterCode,
        "LocalTestRunner.java": buildLocalTestRunner(sample.input, sample.expectedOutput),
        "sample-input.txt": sample.input,
        "sample-output.txt": sample.expectedOutput
      },
      functionSignature: problem.functionSignature
    };
  });

  app.post("/problems/generate", async (request, reply) => {
    const parsed = generateBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.message });
    }

    const generated = await problemGenerationService.generateFromInput(
      parsed.data.input,
      parsed.data.isCustomProblem
    );

    const saved = await problemService.createProblem(
      parsed.data.input,
      "ai_generated",
      generated
    );

    return saved;
  });

  app.post("/problems", async (request, reply) => {
    const parsed = saveCustomBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.message });
    }

    const saved = await problemService.createProblem(parsed.data.sourceInput, "custom", parsed.data);
    return saved;
  });

  app.post<{ Params: { id: string } }>("/problems/:id/generate-tests", async (request, reply) => {
    const problem = await problemService.getProblemById(Number(request.params.id));
    if (!problem) {
      return reply.status(404).send({ message: "Problem not found" });
    }

    const payload = await problemGenerationService.generateMoreTests(problem.statement);
    return payload;
  });

  app.post<{ Params: { id: string } }>("/problems/:id/generate-hints", async (request, reply) => {
    const problem = await problemService.getProblemById(Number(request.params.id));
    if (!problem) {
      return reply.status(404).send({ message: "Problem not found" });
    }

    const payload = await problemGenerationService.generateHints(problem.statement);
    return payload;
  });
}
