"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/modules/calls/server/call.service";

const FILLS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

type Props = {
  stats: DashboardStats;
};

export function DashboardCharts({ stats }: Props) {
  const sentimentRows = [
    { name: "Positive", value: stats.sentiment.positive },
    { name: "Neutral", value: stats.sentiment.neutral },
    { name: "Negative", value: stats.sentiment.negative },
  ];
  const sentimentTotal = sentimentRows.reduce((a, r) => a + r.value, 0);
  const sentimentData = sentimentRows.filter((r) => r.value > 0);

  const keywordChart = stats.topKeywords.slice(0, 6).map((k) => ({
    word: k.word.length > 14 ? `${k.word.slice(0, 12)}…` : k.word,
    count: k.count,
  }));

  const tooltipStyle = {
    backgroundColor: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    color: "var(--popover-foreground)",
    fontSize: 12,
  };

  return (
    <div className="mt-10 space-y-4">
      <h2 className="font-heading text-lg font-semibold tracking-tight">Analysis charts</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="min-h-[320px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sentiment mix</CardTitle>
            <CardDescription>Share of calls by detected sentiment</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px] pt-0">
            {sentimentTotal === 0 ? (
              <EmptyChart label="Upload and analyse calls to see sentiment." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {sentimentData.map((entry, i) => (
                      <Cell key={entry.name} fill={FILLS[i % FILLS.length]} stroke="var(--border)" strokeWidth={1} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, "Calls"]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="min-h-[320px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Calls analysed (14 days)</CardTitle>
            <CardDescription>Completed or partial runs per day (UTC)</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px] pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.callsByDay} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="callsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={28} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, "Calls"]} />
                <Area type="monotone" dataKey="count" stroke="var(--chart-1)" strokeWidth={2} fill="url(#callsFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="min-h-[320px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Score distribution</CardTitle>
            <CardDescription>How overall scores cluster (0–10)</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px] pt-0">
            {stats.scoreDistribution.every((b) => b.count === 0) ? (
              <EmptyChart label="No scored calls yet." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.scoreDistribution} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={28} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, "Calls"]} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {stats.scoreDistribution.map((_, i) => (
                      <Cell key={i} fill={FILLS[i % FILLS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="min-h-[320px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top keywords</CardTitle>
            <CardDescription>Frequency across analysed calls</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px] pt-0">
            {keywordChart.length === 0 ? (
              <EmptyChart label="Keywords appear after analysis extracts them." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={keywordChart}
                  layout="vertical"
                  margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="word"
                    width={72}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, "Count"]} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {keywordChart.map((_, i) => (
                      <Cell key={i} fill={FILLS[(i + 2) % FILLS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="text-muted-foreground flex h-full min-h-[200px] items-center justify-center text-center text-sm">
      {label}
    </div>
  );
}
