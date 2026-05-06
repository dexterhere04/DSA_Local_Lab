import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().default("./data/dsa_lab.db"),
  FRONTEND_ORIGIN: z.string().default("http://localhost:5173"),
  OPENAI_BASE_URL: z.string().url().default("https://api.openai.com/v1"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  JAVA_BIN: z.string().default("java"),
  JAVAC_BIN: z.string().default("javac"),
  EXECUTION_TIMEOUT_MS: z.coerce.number().default(2000)
});

export const env = envSchema.parse(process.env);
