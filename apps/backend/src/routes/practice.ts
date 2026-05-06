import { FastifyInstance } from "fastify";
import { z } from "zod";
import { problemService } from "../services/problemService.js";

const createSetBody = z.object({
  name: z.string().min(2),
  description: z.string().default(""),
  problemIds: z.array(z.number().int().positive()).default([])
});

export async function practiceRoutes(app: FastifyInstance) {
  app.get("/topics", async () => problemService.getTopicExplorer());

  app.get("/problem-sets", async () => problemService.listProblemSets());

  app.post("/problem-sets", async (request, reply) => {
    const parsed = createSetBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.message });
    }

    const created = await problemService.createProblemSet(
      parsed.data.name,
      parsed.data.description,
      parsed.data.problemIds
    );

    return created;
  });
}
