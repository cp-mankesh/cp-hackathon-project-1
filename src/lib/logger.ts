import { appendFile, mkdir } from "fs/promises";
import path from "path";

const LOG_ROOT = path.join(process.cwd(), "logs", "analysis");

export type LogLevel = "info" | "warn" | "error";

export type AnalysisLogPayload = {
  level: LogLevel;
  message: string;
  organisationId?: string;
  userId?: string;
  jobId?: string;
  batchId?: string;
  callId?: string;
  error?: string;
  [key: string]: unknown;
};

/**
 * Append one JSON line to rotating-friendly log files for the analysis worker and API.
 */
export async function logAnalysisEvent(payload: AnalysisLogPayload): Promise<void> {
  const line =
    JSON.stringify({
      ts: new Date().toISOString(),
      ...payload,
    }) + "\n";

  try {
    await mkdir(LOG_ROOT, { recursive: true });
    const day = new Date().toISOString().slice(0, 10);
    await appendFile(path.join(LOG_ROOT, `analysis-${day}.log`), line, "utf8");
  } catch {
    // Never break callers on logging failure
    if (process.env.NODE_ENV === "development") {
      console.error("[logAnalysisEvent] failed", payload);
    }
  }
}
