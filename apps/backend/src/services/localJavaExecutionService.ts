import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { env } from "../config/env.js";
import type { Verdict } from "../types.js";
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
  verdict: Verdict;
}

export interface RunCaseOptions {
  timeLimitMs?: number;
  memoryLimitMb?: number;
}

const formatExecError = (error: unknown) => {
  if (error && typeof error === "object") {
    const err = error as { stderr?: string; stdout?: string; message?: string };
    return err.stderr || err.stdout || err.message || "Execution failed";
  }
  return String(error);
};

const stderrText = (error: unknown): string => {
  if (error && typeof error === "object") {
    const err = error as { stderr?: string; stdout?: string; message?: string };
    return `${err.stderr ?? ""}\n${err.stdout ?? ""}\n${err.message ?? ""}`;
  }
  return String(error);
};

const wasKilled = (error: unknown): boolean => {
  if (error && typeof error === "object") {
    const err = error as { killed?: boolean; signal?: string };
    return err.killed === true || err.signal === "SIGTERM" || err.signal === "SIGKILL";
  }
  return false;
};

export class LocalJavaExecutionService {
  async runCase(
    userCode: string,
    input: string,
    expectedOutput: string,
    hidden: boolean,
    opts: RunCaseOptions = {}
  ): Promise<CaseExecution> {
    const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "dsa-lab-java-"));
    const sourceCode = buildJudgeRunnerSource(userCode, input);
    const timeLimitMs = opts.timeLimitMs ?? env.EXECUTION_TIMEOUT_MS;
    const memoryLimitMb = opts.memoryLimitMb;

    try {
      await fs.writeFile(path.join(workDir, "Solution.java"), sourceCode, "utf-8");

      try {
        await execFileAsync(env.JAVAC_BIN, ["Solution.java"], {
          cwd: workDir,
          timeout: timeLimitMs,
          maxBuffer: 1024 * 1024
        });
      } catch (error) {
        return {
          input,
          expectedOutput,
          actualOutput: "",
          passed: false,
          hidden,
          error: formatExecError(error),
          verdict: "CE"
        };
      }

      const javaArgs = memoryLimitMb ? [`-Xmx${memoryLimitMb}m`, "Runner"] : ["Runner"];
      const start = Date.now();
      try {
        const { stdout, stderr } = await execFileAsync(env.JAVA_BIN, javaArgs, {
          cwd: workDir,
          timeout: timeLimitMs,
          maxBuffer: 1024 * 1024
        });

        const runtimeMs = Date.now() - start;
        const actualOutput = stdout.trim();
        const combinedErr = stderr?.trim();
        const passed = actualOutput === expectedOutput.trim() && !combinedErr;

        let verdict: Verdict;
        if (!passed && combinedErr) {
          if (/OutOfMemoryError/i.test(combinedErr)) {
            verdict = "MLE";
          } else {
            verdict = "RE";
          }
        } else if (!passed) {
          verdict = "WA";
        } else {
          verdict = "AC";
        }

        return {
          input,
          expectedOutput,
          actualOutput,
          passed,
          hidden,
          runtimeMs,
          error: combinedErr || undefined,
          verdict
        };
      } catch (error) {
        const combinedErr = stderrText(error);
        let verdict: Verdict;
        if (wasKilled(error)) {
          verdict = "TLE";
        } else if (/OutOfMemoryError/i.test(combinedErr)) {
          verdict = "MLE";
        } else {
          verdict = "RE";
        }

        return {
          input,
          expectedOutput,
          actualOutput: "",
          passed: false,
          hidden,
          runtimeMs: Date.now() - start,
          error: formatExecError(error),
          verdict
        };
      }
    } finally {
      await fs.rm(workDir, { recursive: true, force: true });
    }
  }
}

export const localJavaExecutionService = new LocalJavaExecutionService();
