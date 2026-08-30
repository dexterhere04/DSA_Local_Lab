import { FastifyInstance } from "fastify";
import { z } from "zod";
import { configService } from "../config/configService.js";
import { resetJavaStatus } from "../services/runtimeStatus.js";

const settingsBody = z.object({
  openaiBaseUrl: z.string().min(1).optional(),
  openaiApiKey: z.string().optional(),
  openaiModel: z.string().min(1).optional(),
  javaBin: z.string().min(1).optional(),
  javacBin: z.string().min(1).optional(),
  executionTimeoutMs: z.coerce.number().int().positive().optional()
});

export async function settingsRoutes(app: FastifyInstance) {
  app.get("/settings", async () => {
    const config = configService.get();
    return {
      openaiBaseUrl: config.openaiBaseUrl,
      openaiModel: config.openaiModel,
      hasApiKey: config.openaiApiKey.length > 0,
      javaBin: config.javaBin,
      javacBin: config.javacBin,
      executionTimeoutMs: config.executionTimeoutMs
    };
  });

  app.put("/settings", async (request, reply) => {
    const parsed = settingsBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.message });
    }

    const next = configService.update(parsed.data);
    resetJavaStatus();

    return {
      openaiBaseUrl: next.openaiBaseUrl,
      openaiModel: next.openaiModel,
      hasApiKey: next.openaiApiKey.length > 0,
      javaBin: next.javaBin,
      javacBin: next.javacBin,
      executionTimeoutMs: next.executionTimeoutMs
    };
  });
}
