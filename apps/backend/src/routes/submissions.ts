import { FastifyInstance } from "fastify";
import { z } from "zod";
import { localJavaExecutionService } from "../services/localJavaExecutionService.js";
import { problemService } from "../services/problemService.js";
import type { Verdict } from "../types.js";

const submissionBody = z.object({
  problemId: z.number().int().positive(),
  code: z.string().min(1),
  mode: z.enum(["run", "submit"])
});

const VERDICT_REASON: Record<Verdict, string> = {
  AC: "Accepted",
  WA: "Wrong Answer",
  TLE: "Time Limit Exceeded",
  MLE: "Memory Limit Exceeded",
  RE: "Runtime Error",
  CE: "Compilation Error"
};

export async function submissionRoutes(app: FastifyInstance) {
  app.get("/submissions", async () => problemService.getSubmissionHistory());

  app.post("/submissions", async (request, reply) => {
    const parsed = submissionBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.message });
    }

    const problem = await problemService.getProblemById(parsed.data.problemId);
    if (!problem) {
      return reply.status(404).send({ message: "Problem not found" });
    }

    const tests = parsed.data.mode === "run" ? problem.publicTests : [...problem.publicTests, ...problem.hiddenTests];

    const results = [];
    for (const test of tests) {
      const result = await localJavaExecutionService.runCase(
        parsed.data.code,
        test.input,
        test.expectedOutput,
        test.isHidden,
        {
          timeLimitMs: problem.timeLimitMs,
          memoryLimitMb: problem.memoryLimitMb
        }
      );

      if (test.isHidden) {
        results.push({
          passed: result.passed,
          hidden: true,
          verdict: result.verdict,
          runtimeMs: result.runtimeMs,
          memoryKb: result.memoryKb,
          reason: result.passed ? undefined : VERDICT_REASON[result.verdict]
        });
      } else {
        results.push(result);
      }

      if (!result.passed && parsed.data.mode === "submit") {
        break;
      }
    }

    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = tests.length;
    const accepted = passedCount === totalCount;

    const runtimeMs = Math.max(...results.map((r) => r.runtimeMs ?? 0), 0);
    const memoryKb = Math.max(...results.map((r) => r.memoryKb ?? 0), 0);

    const status = accepted ? "accepted" : "failed";

    const saved = await problemService.saveSubmission({
      problemId: parsed.data.problemId,
      code: parsed.data.code,
      mode: parsed.data.mode,
      status,
      passedCount,
      totalCount,
      runtimeMs,
      memoryKb,
      resultDetails: results
    });

    return {
      submissionId: saved.id,
      status,
      passedCount,
      totalCount,
      runtimeMs,
      memoryKb,
      results
    };
  });
}
