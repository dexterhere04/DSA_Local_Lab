import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { env } from "../config/env.js";
import { buildJudgeRunnerSource } from "./javaTemplate.js";

const execFileAsync = promisify(execFile);

export interface CaseExecution {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  hidden: boolean;
  runtimeMs?: number;
  memoryKb?: number;
  error?: string;
}

const formatExecError = (error: unknown) => {
  if (error && typeof error === "object") {
    const err = error as { stderr?: string; stdout?: string; message?: string };
    return err.stderr || err.stdout || err.message || "Execution failed";
  }
  return String(error);
};

export class LocalJavaExecutionService {
  async runCase(userCode: string, input: string, expectedOutput: string, hidden: boolean): Promise<CaseExecution> {
    const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "dsa-lab-java-"));
    const sourceCode = buildJudgeRunnerSource(userCode, input);

    try {
      await fs.writeFile(path.join(workDir, "Solution.java"), sourceCode, "utf-8");

      try {
        await execFileAsync(env.JAVAC_BIN, ["Solution.java"], {
          cwd: workDir,
          timeout: env.EXECUTION_TIMEOUT_MS,
          maxBuffer: 1024 * 1024
        });
      } catch (error) {
        return {
          input,
          expectedOutput,
          actualOutput: "",
          passed: false,
          hidden,
          error: formatExecError(error)
        };
      }

      const start = Date.now();
      try {
        const { stdout, stderr } = await execFileAsync(env.JAVA_BIN, ["Runner"], {
          cwd: workDir,
          timeout: env.EXECUTION_TIMEOUT_MS,
          maxBuffer: 1024 * 1024
        });

        const runtimeMs = Date.now() - start;
        const actualOutput = stdout.trim();
        const passed = actualOutput === expectedOutput.trim();

        return {
          input,
          expectedOutput,
          actualOutput,
          passed,
          hidden,
          runtimeMs,
          error: stderr?.trim() || undefined
        };
      } catch (error) {
        return {
          input,
          expectedOutput,
          actualOutput: "",
          passed: false,
          hidden,
          runtimeMs: Date.now() - start,
          error: formatExecError(error)
        };
      }
    } finally {
      await fs.rm(workDir, { recursive: true, force: true });
    }
  }
}

export const localJavaExecutionService = new LocalJavaExecutionService();