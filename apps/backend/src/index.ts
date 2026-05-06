import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./config/env.js";
import { problemRoutes } from "./routes/problems.js";
import { submissionRoutes } from "./routes/submissions.js";
import { practiceRoutes } from "./routes/practice.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: env.FRONTEND_ORIGIN
});

app.get("/health", async () => ({ ok: true }));

await app.register(async (api) => {
  await problemRoutes(api);
  await submissionRoutes(api);
  await practiceRoutes(api);
}, { prefix: "/api" });

const start = async () => {
  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

await start();
