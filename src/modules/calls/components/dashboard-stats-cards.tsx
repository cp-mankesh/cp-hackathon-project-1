import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/modules/calls/server/call.service";

type Props = {
  stats: DashboardStats;
};

export function DashboardStatsCards({ stats }: Props) {
  const { totalCallsProcessed, sentiment, averageCallScore, avgDurationSec, topKeywords, actionItemsTotal } =
    stats;

  const fmtDur = (sec: number | null) => {
    if (sec == null || Number.isNaN(sec)) return "—";
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}m ${s}s`;
  };

  const fmtScore = (n: number | null) => (n == null ? "—" : n.toFixed(1));

  const sentimentTotal = sentiment.positive + sentiment.negative + sentiment.neutral;
  const sentimentLabel =
    sentimentTotal === 0
      ? "No data yet"
      : `${sentiment.positive} pos · ${sentiment.neutral} neu · ${sentiment.negative} neg`;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total calls processed</CardDescription>
          <CardTitle className="text-3xl tabular-nums">{totalCallsProcessed}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-xs">Completed or partial analysis (org-wide).</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Sentiment split</CardDescription>
          <CardTitle className="text-lg leading-snug">{sentimentLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-xs">Across calls with insight records.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Average call score</CardDescription>
          <CardTitle className="text-3xl tabular-nums">{fmtScore(averageCallScore)}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-xs">Mean 0–10 where insights exist.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Avg. call duration</CardDescription>
          <CardTitle className="text-3xl tabular-nums">{fmtDur(avgDurationSec)}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-xs">Mean duration when metadata is present.</p>
        </CardContent>
      </Card>

      <Card className="sm:col-span-2 xl:col-span-2">
        <CardHeader className="pb-2">
          <CardDescription>Top keywords</CardDescription>
          <CardTitle className="text-base font-medium leading-relaxed">
            {topKeywords.length === 0
              ? "—"
              : topKeywords.map((k) => `${k.word} (${k.count})`).join(" · ")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-xs">Aggregated from per-call insight keywords.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Action items total</CardDescription>
          <CardTitle className="text-3xl tabular-nums">{actionItemsTotal}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-xs">Follow-up items across all calls.</p>
        </CardContent>
      </Card>
    </div>
  );
}
