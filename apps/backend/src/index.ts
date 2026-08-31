import fs from "node:fs";
import path from "node:path";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { env } from "./config/env.js";
import { problemRoutes } from "./routes/problems.js";
import { submissionRoutes } from "./routes/submissions.js";
import { practiceRoutes } from "./routes/practice.js";
import { settingsRoutes } from "./routes/settings.js";
import { detectJava } from "./services/runtimeStatus.js";

const app = Fastify({ logger: true });

async function main() {
  await app.register(cors, {
    origin: env.FRONTEND_ORIGIN
  });

  await app.register(async (api) => {
    api.get("/health", async () => {
      const java = await detectJava();
      return { ok: true, java };
    });

    await problemRoutes(api);
    await submissionRoutes(api);
    await practiceRoutes(api);
    await settingsRoutes(api);
  }, { prefix: "/api" });

  const webDist = env.WEB_DIST_DIR
    ? path.resolve(env.WEB_DIST_DIR)
    : path.resolve(process.cwd(), "..", "web", "dist");

  if (fs.existsSync(webDist)) {
    await app.register(fastifyStatic, { root: webDist, prefix: "/" });

    app.setNotFoundHandler((request, reply) => {
      if (request.method === "GET" && !request.url.startsWith("/api/")) {
        return reply.sendFile("index.html");
      }
      return reply.status(404).send({ message: "Not found" });
    });
  }

  try {
    await app.listen({ port: env.PORT, host: "127.0.0.1" });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

main();
