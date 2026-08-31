import "dotenv/config";
import dotenv from "dotenv";
import fs from "node:fs";
import { z } from "zod";

const resolvedConfigPath = process.env.CONFIG_PATH;
if (resolvedConfigPath && fs.existsSync(resolvedConfigPath)) {
  dotenv.config({ path: resolvedConfigPath, override: false });
}

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().default("./data/dsa_lab.db"),
  FRONTEND_ORIGIN: z.string().default("http://localhost:5173"),
  MIGRATIONS_DIR: z.string().optional(),
  CONFIG_PATH: z.string().optional(),
  WEB_DIST_DIR: z.string().optional()
});

export const env = envSchema.parse(process.env);

export const configPath = process.env.CONFIG_PATH;
