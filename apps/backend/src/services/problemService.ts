import slugify from "slugify";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { problems, problemSets, problemSetItems, submissions, testCases } from "../db/schema.js";
import type { GeneratedProblem } from "../types.js";

export class ProblemService {
  async createProblem(sourceInput: string, sourceType: "ai_generated" | "custom", payload: GeneratedProblem) {
    const slugBase = slugify(payload.title, { lower: true, strict: true });
    const slug = `${slugBase}-${Date.now()}`;

    const inserted = await db
      .insert(problems)
      .values({
        title: payload.title,
        slug,
        sourceType,
        sourceInput,
        statement: payload.statement,
        constraints: payload.constraints,
        examples: payload.examples,
        edgeCases: payload.edgeCases,
        hints: payload.hints,
        functionSignature: payload.functionSignature,
        starterCode: payload.starterCode,
        expectedComplexity: payload.expectedComplexity,
        difficulty: payload.difficulty,
        tags: payload.tags,
        referenceSolution: payload.referenceSolution ?? "",
        timeLimitMs: payload.timeLimitMs ?? 2000,
        memoryLimitMb: payload.memoryLimitMb ?? 256
      })
      .returning();

    const problem = inserted[0];

    await db.insert(testCases).values(
      [...payload.publicTests, ...payload.hiddenTests].map((test) => ({
        problemId: problem.id,
        input: test.input,
        expectedOutput: test.expectedOutput,
        explanation: test.explanation,
        isHidden: test.isHidden,
        weight: test.weight ?? 1
      }))
    );

    return this.getProblemById(problem.id);
  }

  async getProblemById(id: number) {
    const [problem] = await db.select().from(problems).where(eq(problems.id, id)).limit(1);
    if (!problem) {
      return null;
    }

    const problemTests = await db
      .select()
      .from(testCases)
      .where(eq(testCases.problemId, id));

    const { referenceSolution: _referenceSolution, ...safeProblem } = problem;

    return {
      ...safeProblem,
      publicTests: problemTests.filter((tc) => !tc.isHidden),
      hiddenTests: problemTests.filter((tc) => tc.isHidden)
    };
  }

  async listProblems() {
    return db
      .select({
        id: problems.id,
        title: problems.title,
        slug: problems.slug,
        difficulty: problems.difficulty,
        tags: problems.tags,
        createdAt: problems.createdAt
      })
      .from(problems)
      .orderBy(desc(problems.id));
  }

  async saveSubmission(input: {
    problemId: number;
    code: string;
    mode: "run" | "submit";
    status: string;
    passedCount: number;
    totalCount: number;
    runtimeMs?: number;
    memoryKb?: number;
    resultDetails: unknown;
  }) {
    const inserted = await db
      .insert(submissions)
      .values({
        problemId: input.problemId,
        code: input.code,
        mode: input.mode,
        status: input.status,
        passedCount: input.passedCount,
        totalCount: input.totalCount,
        runtimeMs: input.runtimeMs,
        memoryKb: input.memoryKb,
        resultDetails: input.resultDetails
      })
      .returning();

    return inserted[0];
  }

  async getSubmissionHistory() {
    return db
      .select({
        id: submissions.id,
        problemId: submissions.problemId,
        status: submissions.status,
        mode: submissions.mode,
        passedCount: submissions.passedCount,
        totalCount: submissions.totalCount,
        runtimeMs: submissions.runtimeMs,
        memoryKb: submissions.memoryKb,
        createdAt: submissions.createdAt,
        title: problems.title
      })
      .from(submissions)
      .innerJoin(problems, eq(submissions.problemId, problems.id))
      .orderBy(desc(submissions.id));
  }

  async getTopicExplorer() {
    const rows = await db.select({ tags: problems.tags }).from(problems);
    const counts = new Map<string, number>();

    for (const row of rows) {
      const tags = (row.tags as string[]) ?? [];
      for (const tag of tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));
  }

  async createProblemSet(name: string, description: string, problemIds: number[]) {
    const inserted = await db
      .insert(problemSets)
      .values({ name, description })
      .returning();

    const set = inserted[0];

    if (problemIds.length > 0) {
      await db.insert(problemSetItems).values(
        problemIds.map((problemId) => ({
          problemSetId: set.id,
          problemId
        }))
      );
    }

    return set;
  }

  async listProblemSets() {
    const sets = await db.select().from(problemSets).orderBy(desc(problemSets.id));

    const items = await db.select().from(problemSetItems);
    const grouped = new Map<number, number[]>();

    for (const item of items) {
      const list = grouped.get(item.problemSetId) ?? [];
      list.push(item.problemId);
      grouped.set(item.problemSetId, list);
    }

    return sets.map((set) => ({
      ...set,
      problemIds: grouped.get(set.id) ?? []
    }));
  }
}

export const problemService = new ProblemService();
