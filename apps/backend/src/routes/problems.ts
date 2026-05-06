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

    const generator = problemGenerationService.generateFromInput(
      parsed.data.input,
      parsed.data.isCustomProblem
    );

    let result: Awaited<ReturnType<typeof generator.next>>;
    while (!(result = await generator.next()).done) {
      // Consume progress (not sent in non-streaming mode)
    }

    const generated = result.value;

    const saved = await problemService.createProblem(
      parsed.data.input,
      "ai_generated",
      generated
    );

    return saved;
  });

  app.post("/problems/generate/stream", async (request, reply) => {
    const parsed = generateBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.message });
    }

    reply.hijack();
    const res = reply.raw;

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": "*"
    });

    const send = (data: Record<string, unknown>) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const generator = problemGenerationService.generateFromInput(
        parsed.data.input,
        parsed.data.isCustomProblem
      );

      let result: Awaited<ReturnType<typeof generator.next>>;
      while (!(result = await generator.next()).done) {
        send({ type: "progress", data: result.value });
      }

      const generated = result.value;

      const saved = await problemService.createProblem(
        parsed.data.input,
        "ai_generated",
        generated
      );

      send({ type: "complete", data: saved });
    } catch (err) {
      send({
        type: "error",
        data: { message: (err as Error).message }
      });
    }

    res.write("data: [DONE]\n\n");
    res.end();
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
