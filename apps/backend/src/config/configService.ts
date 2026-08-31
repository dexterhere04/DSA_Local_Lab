import fs from "node:fs";
import path from "node:path";
import { env } from "./env.js";

export interface RuntimeConfig {
  openaiBaseUrl: string;
  openaiApiKey: string;
  openaiModel: string;
  javaBin: string;
  javacBin: string;
  executionTimeoutMs: number;
}

const ENV_KEYS: Record<keyof RuntimeConfig, string> = {
  openaiBaseUrl: "OPENAI_BASE_URL",
  openaiApiKey: "OPENAI_API_KEY",
  openaiModel: "OPENAI_MODEL",
  javaBin: "JAVA_BIN",
  javacBin: "JAVAC_BIN",
  executionTimeoutMs: "EXECUTION_TIMEOUT_MS"
};

const DEFAULTS: RuntimeConfig = {
  openaiBaseUrl: "https://api.openai.com/v1",
  openaiApiKey: "",
  openaiModel: "gpt-4.1-mini",
  javaBin: "java",
  javacBin: "javac",
  executionTimeoutMs: 2000
};

let current: RuntimeConfig = readConfig();

function readConfig(): RuntimeConfig {
  const source = process.env;
  return {
    openaiBaseUrl: source.OPENAI_BASE_URL || DEFAULTS.openaiBaseUrl,
    openaiApiKey: source.OPENAI_API_KEY || DEFAULTS.openaiApiKey,
    openaiModel: source.OPENAI_MODEL || DEFAULTS.openaiModel,
    javaBin: source.JAVA_BIN || DEFAULTS.javaBin,
    javacBin: source.JAVAC_BIN || DEFAULTS.javacBin,
    executionTimeoutMs: Number(source.EXECUTION_TIMEOUT_MS) || DEFAULTS.executionTimeoutMs
  };
}

function envFileTarget(): string {
  if (env.CONFIG_PATH) return env.CONFIG_PATH;
  return path.resolve(process.cwd(), ".env");
}

function persist(partial: Partial<RuntimeConfig>) {
  const target = envFileTarget();
  const lines = fs.existsSync(target) ? fs.readFileSync(target, "utf-8").split(/\r?\n/) : [];
  const present = new Set<string>();

  for (const [key, value] of Object.entries(partial)) {
    if (value === undefined) continue;
    const envKey = ENV_KEYS[key as keyof RuntimeConfig];
    const newLine = `${envKey}=${value}`;
    const idx = lines.findIndex((l) => l.trim().startsWith(`${envKey}=`));
    if (idx !== -1) {
      lines[idx] = newLine;
    } else {
      lines.push(newLine);
    }
    present.add(envKey);
  }

  fs.writeFileSync(target, lines.filter((l) => l.trim() !== "").join("\n") + "\n", "utf-8");
}

export const configService = {
  get(): RuntimeConfig {
    return { ...current };
  },

  update(partial: Partial<RuntimeConfig>): RuntimeConfig {
    current = { ...current, ...partial };
    persist(partial);
    return this.get();
  }
};
