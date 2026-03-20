"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AGENT_SCORE_KEYS } from "@/modules/calls/constants";

type Props = {
  agentTalkPct: number;
  customerTalkPct: number;
  agentScores: Record<string, number>;
  questionnaire: Array<{ topic: string; asked: boolean }>;
};

const FILLS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  color: "var(--popover-foreground)",
  fontSize: 12,
};

export function CallOverviewCharts({ agentTalkPct, customerTalkPct, agentScores, questionnaire }: Props) {
  const talkTimeData = [
    { name: "Agent", value: Number(agentTalkPct.toFixed(1)) },
    { name: "Customer", value: Number(customerTalkPct.toFixed(1)) },
  ];

  const scoreData = AGENT_SCORE_KEYS.map(({ key, label }, i) => ({
    label: label.length > 18 ? `${label.slice(0, 16)}…` : label,
    value: Number(agentScores[key] ?? 0),
    fill: FILLS[i % FILLS.length],
  }));

  const asked = questionnaire.filter((q) => q.asked).length;
  const notAsked = Math.max(0, questionnaire.length - asked);
  const coverageData =
    questionnaire.length > 0
      ? [
          { name: "Asked", value: asked },
          { name: "Not asked", value: notAsked },
        ]
      : [];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="min-h-[280px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Talk-time split</CardTitle>
          <CardDescription>Estimated speaker share for this call</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] pt-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={talkTimeData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                {talkTimeData.map((entry, i) => (
                  <Cell key={entry.name} fill={FILLS[i % FILLS.length]} stroke="var(--border)" strokeWidth={1} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "Share"]} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="min-h-[280px] lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Agent score profile</CardTitle>
          <CardDescription>Dimension-level scores (1–10)</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] pt-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scoreData} margin={{ top: 6, right: 6, left: -10, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={0} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={28} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v.toFixed(1), "Score"]} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {scoreData.map((row) => (
                  <Cell key={row.label} fill={row.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {coverageData.length > 0 ? (
        <Card className="min-h-[280px] lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Discovery coverage</CardTitle>
            <CardDescription>
              {asked}/{questionnaire.length} discovery topics were covered
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[180px] pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={coverageData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={68} paddingAngle={2}>
                  <Cell fill="var(--chart-2)" stroke="var(--border)" strokeWidth={1} />
                  <Cell fill="var(--chart-5)" stroke="var(--border)" strokeWidth={1} />
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, "Topics"]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
