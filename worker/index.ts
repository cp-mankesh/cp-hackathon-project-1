/**
 * Background worker: polls DB for QUEUED analysis jobs, runs transcription + analysis.
 * Run: `npm run worker` — keeps running until Ctrl+C. Production may use Redis/BullMQ instead of DB polling.
 */
import "dotenv/config";
import {
  AnalysisJobStatus,
  CallProcessingStatus,
} from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { logAnalysisEvent } from "../src/lib/logger";
import { analyzeTranscriptStub } from "../src/services/analysis";
import { readAudioFile } from "../src/services/storage/local-audio";
import { transcribeAudio } from "../src/services/transcription";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const onceMode =
  process.argv.includes("--once") ||
  process.env.WORKER_ONCE === "1" ||
  process.env.WORKER_ONCE === "true";

const pollMsRaw = process.env.WORKER_POLL_MS;
const pollMs = Math.max(250, Number.parseInt(pollMsRaw ?? "1000", 10) || 1000);

async function processNextJob(): Promise<boolean> {
  const job = await prisma.analysisJob.findFirst({
    where: { status: AnalysisJobStatus.QUEUED },
    include: { call: true },
    orderBy: { createdAt: "asc" },
  });

  if (!job) {
    return false;
  }

  const { call } = job;

  try {
    console.log(`[worker] Job ${job.id} call ${call.id} → TRANSCRIBING (key=${call.audioStorageKey})`);

    await prisma.call.update({
      where: { id: call.id },
      data: { status: CallProcessingStatus.TRANSCRIBING },
    });
    await prisma.analysisJob.update({
      where: { id: job.id },
      data: {
        status: AnalysisJobStatus.TRANSCRIBING,
        startedAt: new Date(),
      },
    });

    const buffer = await readAudioFile(call.audioStorageKey);
    console.log(`[worker] Read audio ${buffer.length} bytes`);

    const transcription = await transcribeAudio({
      audioBuffer: buffer,
      mimeType: call.mimeType,
      organisationId: call.organisationId,
      callId: call.id,
      durationSec: call.durationSec,
    });
    if (!transcription.fullText.trim()) {
      throw new Error("Transcription failed or returned empty text");
    }

    await prisma.transcript.create({
      data: {
        callId: call.id,
        fullText: transcription.fullText,
        segments: transcription.segments === undefined ? undefined : (transcription.segments as object),
      },
    });
    console.log(`[worker] Transcript saved (${transcription.fullText.length} chars)`);

    await prisma.analysisJob.update({
      where: { id: job.id },
      data: { status: AnalysisJobStatus.ANALYZING },
    });
    await prisma.call.update({
      where: { id: call.id },
      data: { status: CallProcessingStatus.ANALYZING },
    });

    const analysis = await analyzeTranscriptStub({
      organisationId: call.organisationId,
      callId: call.id,
      transcriptText: transcription.fullText,
    });

    await prisma.callInsight.create({
      data: {
        callId: call.id,
        summary: analysis.summary,
        sentiment: analysis.sentiment,
        overallScore: analysis.overallScore,
        agentTalkPct: analysis.agentTalkPct,
        customerTalkPct: analysis.customerTalkPct,
        agentScoresJson: analysis.agentScoresJson,
        questionnaireJson: analysis.questionnaireJson,
        keywordsJson: analysis.keywordsJson,
        actionItemsJson: analysis.actionItemsJson,
        positiveObservationsJson: analysis.positiveObservationsJson,
        negativeObservationsJson: analysis.negativeObservationsJson,
      },
    });
    console.log(`[worker] Insight saved (score=${analysis.overallScore}, sentiment=${analysis.sentiment})`);

    await prisma.analysisJob.update({
      where: { id: job.id },
      data: {
        status: AnalysisJobStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
    await prisma.call.update({
      where: { id: call.id },
      data: { status: CallProcessingStatus.COMPLETED },
    });

    await logAnalysisEvent({
      level: "info",
      message: "analysis_job_completed",
      organisationId: call.organisationId,
      jobId: job.id,
      callId: call.id,
    });

    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[worker] Job ${job.id} call ${call.id} FAILED:`, msg);
    await logAnalysisEvent({
      level: "error",
      message: "analysis_job_failed",
      organisationId: call.organisationId,
      jobId: job.id,
      callId: call.id,
      error: msg,
    });
    await prisma.analysisJob.update({
      where: { id: job.id },
      data: {
        status: AnalysisJobStatus.FAILED,
        lastError: msg,
        completedAt: new Date(),
      },
    });
    await prisma.call.update({
      where: { id: call.id },
      data: { status: CallProcessingStatus.FAILED },
    });
    return true;
  }
}

async function runOnceBatch(): Promise<number> {
  let n = 0;
  while (await processNextJob()) {
    n += 1;
  }
  return n;
}

async function runForever(): Promise<void> {
  let shuttingDown = false;
  const onStop = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log("\n[worker] Shutting down…");
  };
  process.on("SIGINT", onStop);
  process.on("SIGTERM", onStop);

  console.log(
    `[worker] Running — draining QUEUED jobs; when idle, polling every ${pollMs}ms. Same DATABASE_URL as Next. Ctrl+C to stop.`,
  );

  while (!shuttingDown) {
    let didWork = false;
    while (!shuttingDown && (await processNextJob())) {
      didWork = true;
    }
    if (shuttingDown) break;
    if (!didWork) {
      await sleep(pollMs);
    }
  }
}

async function main() {
  if (onceMode) {
    const n = await runOnceBatch();
    console.log(`[worker] Finished ${n} job(s) (--once / WORKER_ONCE).`);
    return;
  }

  await runForever();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
