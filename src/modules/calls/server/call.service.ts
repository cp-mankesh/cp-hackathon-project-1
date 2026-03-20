import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function listCallsForOrganisation(
  organisationId: string,
  opts: { take?: number; skip?: number } = {},
) {
  noStore();
  const { take = 50, skip = 0 } = opts;
  return prisma.call.findMany({
    where: { organisationId },
    orderBy: { createdAt: "desc" },
    take,
    skip,
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
      insight: {
        select: {
          sentiment: true,
          overallScore: true,
        },
      },
      analysisJob: { select: { status: true } },
    },
  });
}

export async function getCallForOrganisation(callId: string, organisationId: string) {
  noStore();
  return prisma.call.findFirst({
    where: { id: callId, organisationId },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
      transcript: true,
      insight: true,
      analysisJob: { include: { batches: { orderBy: { batchIndex: "asc" } } } },
    },
  });
}

export type DashboardStats = {
  totalCallsProcessed: number;
  sentiment: { positive: number; negative: number; neutral: number };
  averageCallScore: number | null;
  avgDurationSec: number | null;
  topKeywords: { word: string; count: number }[];
  actionItemsTotal: number;
  /** Overall score buckets (0–10) across calls with insights */
  scoreDistribution: { label: string; count: number }[];
  /** Completed/partial calls finished per day (UTC), last 14 days */
  callsByDay: { label: string; count: number }[];
};

export async function getDashboardStats(organisationId: string): Promise<DashboardStats> {
  noStore();
  const completedCalls = await prisma.call.count({
    where: {
      organisationId,
      status: { in: ["COMPLETED", "PARTIAL"] },
    },
  });

  const insights = await prisma.callInsight.findMany({
    where: { call: { organisationId } },
    select: {
      sentiment: true,
      overallScore: true,
      keywordsJson: true,
      actionItemsJson: true,
      call: { select: { durationSec: true } },
    },
  });

  let positive = 0;
  let negative = 0;
  let neutral = 0;
  let scoreSum = 0;
  let scoreN = 0;
  let durationSum = 0;
  let durationN = 0;
  const keywordCounts = new Map<string, number>();
  let actionItemsTotal = 0;

  for (const row of insights) {
    if (row.sentiment === "POSITIVE") positive += 1;
    else if (row.sentiment === "NEGATIVE") negative += 1;
    else neutral += 1;

    scoreSum += row.overallScore;
    scoreN += 1;
    if (row.call.durationSec != null) {
      durationSum += row.call.durationSec;
      durationN += 1;
    }

    const kw = row.keywordsJson as unknown;
    if (Array.isArray(kw)) {
      for (const w of kw) {
        if (typeof w === "string") {
          const k = w.trim().toLowerCase();
          if (!k) continue;
          keywordCounts.set(k, (keywordCounts.get(k) ?? 0) + 1);
        }
      }
    }

    const actions = row.actionItemsJson as unknown;
    if (Array.isArray(actions)) {
      actionItemsTotal += actions.length;
    }
  }

  const topKeywords = [...keywordCounts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const scoreDistribution = [
    { label: "0 – 4", count: 0 },
    { label: "5 – 6", count: 0 },
    { label: "7 – 8", count: 0 },
    { label: "9 – 10", count: 0 },
  ];
  for (const row of insights) {
    const s = row.overallScore;
    if (s < 5) scoreDistribution[0].count += 1;
    else if (s < 7) scoreDistribution[1].count += 1;
    else if (s < 9) scoreDistribution[2].count += 1;
    else scoreDistribution[3].count += 1;
  }

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 13);
  since.setUTCHours(0, 0, 0, 0);

  const recentCompleted = await prisma.call.findMany({
    where: {
      organisationId,
      status: { in: ["COMPLETED", "PARTIAL"] },
      updatedAt: { gte: since },
    },
    select: { updatedAt: true },
  });

  const dayCounts = new Map<string, number>();
  for (const c of recentCompleted) {
    const key = c.updatedAt.toISOString().slice(0, 10);
    dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
  }

  const y = since.getUTCFullYear();
  const mo = since.getUTCMonth();
  const day = since.getUTCDate();
  const callsByDay: { label: string; count: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(Date.UTC(y, mo, day + i));
    const key = d.toISOString().slice(0, 10);
    callsByDay.push({
      label: d.toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" }),
      count: dayCounts.get(key) ?? 0,
    });
  }

  return {
    totalCallsProcessed: completedCalls,
    sentiment: { positive, negative, neutral },
    averageCallScore: scoreN ? scoreSum / scoreN : null,
    avgDurationSec: durationN ? durationSum / durationN : null,
    topKeywords,
    actionItemsTotal,
    scoreDistribution,
    callsByDay,
  };
}
