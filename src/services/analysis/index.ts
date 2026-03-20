/**
 * LLM analysis: scores, questionnaire, keywords, action items, observations.
 * Implement batched OpenAI calls in worker with ANALYSIS_BATCH_MAX_RETRIES (constants/analysis.ts).
 */
import type { SentimentLabel } from "@prisma/client";
import { createRng, hashString, pickMany, round1 } from "@/lib/seeded-random";
import { AGENT_SCORE_KEYS } from "@/modules/calls/constants";

export type AnalysisPipelineInput = {
  organisationId: string;
  callId: string;
  transcriptText: string;
};

export type AnalysisPipelineResult = {
  summary: string;
  sentiment: SentimentLabel;
  overallScore: number;
  agentTalkPct: number;
  customerTalkPct: number;
  agentScoresJson: Record<string, number>;
  questionnaireJson: Array<{ topic: string; asked: boolean }>;
  keywordsJson: string[];
  actionItemsJson: string[];
  positiveObservationsJson: string[];
  negativeObservationsJson: string[];
};

const QUESTIONNAIRE_TOPICS = [
  "Budget / commercial fit",
  "Timeline / urgency",
  "Decision process & stakeholders",
  "Current tools & workflow",
  "Success criteria",
  "Competitor / status quo",
] as const;

const KEYWORD_POOL = [
  "follow-up",
  "discovery",
  "CRM",
  "recap",
  "next steps",
  "pricing",
  "demo",
  "procurement",
  "stakeholder",
  "timeline",
  "budget",
  "integration",
  "onboarding",
  "contract",
  "pilot",
] as const;

const ACTION_POOL = [
  "Send recap email with pricing bands and sample template within 24h.",
  "Schedule a follow-up to confirm decision-makers and procurement steps.",
  "Add qualification checklist (budget, timeline, sign-off) to call prep for this account.",
  "Share one-pager on security and data handling before the next meeting.",
  "Log outstanding objections in the CRM and assign an owner.",
  "Propose a short pilot scope with clear success metrics.",
] as const;

const POSITIVE_POOL = [
  "Clear agenda-setting and recording notice at the open.",
  "Good mirroring of the customer's pain (missed follow-ups, inconsistent logging).",
  "Concrete suggestion to tag discovery topics and end with owned next steps.",
  "Appropriate pace — allowed the customer space to explain context.",
  "Summarised next steps before closing the call.",
] as const;

const NEGATIVE_POOL = [
  "Decision-process topic was not fully explored before moving to solutions.",
  "Could confirm a specific date/time for the follow-up instead of leaving it implicit.",
  "Missed a chance to quantify impact when the customer raised urgency.",
  "Technical jargon appeared without a quick check for understanding.",
  "Closing felt abrupt relative to the number of open threads.",
] as const;

const SUMMARY_BY_SENTIMENT: Record<SentimentLabel, readonly string[]> = {
  POSITIVE: [
    "Strong discovery cadence: the agent connected product value to stated follow-up pain and secured concrete next steps.",
    "Customer engagement was high; the agent balanced qualification questions with space for the buyer to elaborate.",
    "Call outcome is favourable — clear owner, timeline, and a defined artifact (recap/pricing) before the next touch.",
  ],
  NEUTRAL: [
    "Mixed discovery: core pains were surfaced but several qualification threads stayed shallow or open-ended.",
    "Adequate structure with room to tighten handoffs between problem exploration and solution framing.",
    "Outcome is workable — follow-ups are implied but a few commitments could be made more explicit on the next call.",
  ],
  NEGATIVE: [
    "Discovery gaps: budget, timeline, or decision process were not adequately explored relative to time spent on pitch.",
    "Customer talk-time was constrained; fewer clarifying questions may have limited understanding of true blockers.",
    "Risk of stall: next steps were vague and no single accountable owner or date was confirmed.",
  ],
};

function sentimentForScore(score: number): SentimentLabel {
  if (score < 5.4) return "NEGATIVE";
  if (score < 6.9) return "NEUTRAL";
  return "POSITIVE";
}

function dimensionScore(rng: () => number, overall: number): number {
  const jitter = (rng() - 0.5) * 3.2;
  return Math.max(1, Math.min(10, round1(overall + jitter)));
}

export async function analyzeTranscriptStub(
  input: AnalysisPipelineInput,
): Promise<AnalysisPipelineResult> {
  const seed =
    hashString(
      `${input.callId}\0${input.organisationId}\0${input.transcriptText.length}\0${hashString(input.transcriptText.slice(0, 240))}`,
    ) || 1;
  const rnd = createRng(seed);

  const overallScore = round1(4.1 + rnd() * 4.7);

  const sentiment = sentimentForScore(overallScore);

  const agentTalkPct = Math.round(34 + rnd() * 32);
  const customerTalkPct = 100 - agentTalkPct;

  const agentScoresJson: Record<string, number> = {};
  for (const { key } of AGENT_SCORE_KEYS) {
    agentScoresJson[key] = dimensionScore(rnd, overallScore);
  }

  const questionnaireJson = QUESTIONNAIRE_TOPICS.map((topic) => ({
    topic,
    asked: rnd() > 0.38,
  }));

  const keywordCount = 5 + Math.floor(rnd() * 4);
  const keywordsJson = pickMany(rnd, KEYWORD_POOL, keywordCount);

  const actionCount = 2 + Math.floor(rnd() * 3);
  const actionItemsJson = pickMany(rnd, ACTION_POOL, actionCount);

  const posCount = 2 + Math.floor(rnd() * 2);
  const negCount = 2 + Math.floor(rnd() * 2);
  const positiveObservationsJson = pickMany(rnd, POSITIVE_POOL, posCount);
  const negativeObservationsJson = pickMany(rnd, NEGATIVE_POOL, negCount);

  const summaryPool = SUMMARY_BY_SENTIMENT[sentiment];
  const s1 = summaryPool[Math.floor(rnd() * summaryPool.length)]!;
  const s2 = summaryPool[Math.floor(rnd() * summaryPool.length)]!;
  const summary =
    s1 === s2
      ? `${s1} Average coaching focus: keep discovery parity with solution time.`
      : `${s1} ${s2}`;

  return {
    summary,
    sentiment,
    overallScore,
    agentTalkPct,
    customerTalkPct,
    agentScoresJson,
    questionnaireJson,
    keywordsJson,
    actionItemsJson,
    positiveObservationsJson,
    negativeObservationsJson,
  };
}
