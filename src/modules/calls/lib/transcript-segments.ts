/**
 * Normalised transcript segments for UI + audio seek (matches optional Prisma Transcript.segments JSON).
 */
export type TranscriptSegment = {
  start: number;
  end: number;
  text: string;
  speaker?: "agent" | "customer";
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Parse stored JSON segments; invalid entries are skipped. */
export function parseStoredSegments(raw: unknown): TranscriptSegment[] {
  if (!Array.isArray(raw)) return [];
  const out: TranscriptSegment[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const start = Number(item.start);
    const end = Number(item.end);
    const text = typeof item.text === "string" ? item.text : "";
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || !text.trim()) continue;
    const speaker = item.speaker === "agent" || item.speaker === "customer" ? item.speaker : undefined;
    out.push({ start, end, text, speaker });
  }
  return out.sort((a, b) => a.start - b.start);
}

/**
 * When segments are missing (legacy rows), infer timing from paragraphs so seek still works.
 * `durationSec` falls back to sum of segment-like estimate if null.
 */
export function inferSegmentsFromFullText(fullText: string, durationSec: number | null): TranscriptSegment[] {
  const trimmed = fullText.trim();
  if (!trimmed) return [];

  const paragraphs = trimmed
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return [];

  const totalSec = Math.max(durationSec ?? 0, paragraphs.length * 2, 30);
  const weights = paragraphs.map((p) => Math.max(p.length, 8));
  const wSum = weights.reduce((a, b) => a + b, 0);

  let t = 0;
  const segments: TranscriptSegment[] = [];
  for (let i = 0; i < paragraphs.length; i++) {
    const dur = Math.max((weights[i]! / wSum) * totalSec, 0.8);
    const start = t;
    const end = i === paragraphs.length - 1 ? totalSec : t + dur;
    const text = paragraphs[i]!;
    let speaker: "agent" | "customer" | undefined;
    if (/^\[Agent\]/i.test(text)) speaker = "agent";
    else if (/^\[Customer\]/i.test(text)) speaker = "customer";
    segments.push({ start, end, text, speaker });
    t = end;
  }

  return segments;
}

export function resolveTranscriptSegments(
  segmentsJson: unknown,
  fullText: string,
  durationSec: number | null,
): TranscriptSegment[] {
  const parsed = parseStoredSegments(segmentsJson);
  if (parsed.length > 0) return parsed;
  return inferSegmentsFromFullText(fullText, durationSec);
}

export function formatTimestamp(seconds: number): string {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}
