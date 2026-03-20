/**
 * Audio → transcript (OpenAI Whisper or equivalent). Implement with real API in worker.
 * Log failures via lib/logger; production implementations may batch chunks and retry.
 */
import { env } from "@/lib/env";

export type TranscriptionInput = {
  audioBuffer: Buffer;
  mimeType: string;
  organisationId: string;
  callId: string;
  /** Known recording length (seconds); stub uses this to place segment timestamps. */
  durationSec: number | null;
};

export type TranscriptionSegment = {
  start: number;
  end: number;
  text: string;
  speaker?: "agent" | "customer";
};

export type TranscriptionResult = {
  fullText: string;
  segments?: TranscriptionSegment[];
};

type OpenAiVerboseResponse = {
  text?: string;
  segments?: Array<{
    start?: number;
    end?: number;
    text?: string;
  }>;
};

function normalizeOpenAiSegments(raw: OpenAiVerboseResponse["segments"]): TranscriptionSegment[] {
  if (!Array.isArray(raw)) return [];
  const out: TranscriptionSegment[] = [];
  for (const seg of raw) {
    const start = Number(seg?.start);
    const end = Number(seg?.end);
    const text = typeof seg?.text === "string" ? seg.text.trim() : "";
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || !text) continue;
    out.push({ start, end, text });
  }
  return out;
}

async function transcribeWithOpenAi(input: TranscriptionInput): Promise<TranscriptionResult> {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const filename =
    input.mimeType === "audio/wav"
      ? "call.wav"
      : input.mimeType === "audio/mpeg"
        ? "call.mp3"
        : input.mimeType === "audio/webm"
          ? "call.webm"
          : input.mimeType === "audio/mp4" || input.mimeType === "audio/m4a"
            ? "call.m4a"
            : "call.ogg";

  const bytes = Uint8Array.from(input.audioBuffer);
  const file = new File([bytes], filename, { type: input.mimeType });
  const form = new FormData();
  form.set("file", file);
  form.set("model", "whisper-1");
  form.set("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "segment");

  const resp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`OpenAI transcription failed (${resp.status}) ${txt.slice(0, 400)}`);
  }

  const data = (await resp.json()) as OpenAiVerboseResponse;
  const fullText = (data.text ?? "").trim();
  if (!fullText) {
    throw new Error("OpenAI transcription returned empty text");
  }

  const segments = normalizeOpenAiSegments(data.segments);
  return { fullText, segments };
}

/** Real transcription only; returns blank on missing key/API failure. */
export async function transcribeAudio(input: TranscriptionInput): Promise<TranscriptionResult> {
  if (!env.OPENAI_API_KEY) {
    return { fullText: "", segments: [] };
  }

  try {
    return await transcribeWithOpenAi(input);
  } catch {
    return { fullText: "", segments: [] };
  }
}
