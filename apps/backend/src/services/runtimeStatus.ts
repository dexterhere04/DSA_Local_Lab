import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { configService } from "../config/configService.js";

const execFileAsync = promisify(execFile);

export interface JavaStatus {
  available: boolean;
  version?: string;
}

let cached: JavaStatus | null = null;

async function probe(bin: string): Promise<string | null> {
  try {
    const { stdout, stderr } = await execFileAsync(bin, ["-version"], { timeout: 5000 });
    return (stderr || stdout).trim().split("\n")[0] ?? null;
  } catch (error) {
    const err = error as { stderr?: string; stdout?: string };
    const text = err?.stderr || err?.stdout || "";
    if (text.trim()) return text.trim().split("\n")[0] ?? null;
    return null;
  }
}

export async function detectJava(): Promise<JavaStatus> {
  if (cached) return cached;

  const config = configService.get();
  const version = (await probe(config.javaBin)) ?? (await probe(config.javacBin));

  cached = {
    available: version !== null,
    version: version ?? undefined
  };
  return cached;
}

export function resetJavaStatus() {
  cached = null;
}
