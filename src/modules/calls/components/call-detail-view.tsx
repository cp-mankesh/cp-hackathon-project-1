import type {
  AnalysisBatch,
  AnalysisJob,
  Call,
  CallInsight,
  Transcript,
  User,
} from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AGENT_SCORE_KEYS } from "@/modules/calls/constants";
import { CallAudioTranscript } from "@/modules/calls/components/call-audio-transcript";
import { CallOverviewCharts } from "@/modules/calls/components/call-overview-charts";

type CallDetail = Call & {
  uploadedBy: Pick<User, "id" | "name" | "email">;
  transcript: Transcript | null;
  insight: CallInsight | null;
  analysisJob: (AnalysisJob & { batches: AnalysisBatch[] }) | null;
};

type Props = {
  call: CallDetail;
};

export function CallDetailView({ call }: Props) {
  const insight = call.insight;
  const agentScores = (insight?.agentScoresJson as Record<string, number> | null) ?? null;

  const questionnaire = (insight?.questionnaireJson as Array<{ topic: string; asked: boolean }> | null) ?? [];
  const keywords = (insight?.keywordsJson as string[] | null) ?? [];
  const actions = (insight?.actionItemsJson as string[] | null) ?? [];
  const positive = (insight?.positiveObservationsJson as string[] | null) ?? [];
  const negative = (insight?.negativeObservationsJson as string[] | null) ?? [];

  const audioSrc = `/api/calls/${call.id}/audio`;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{call.status}</Badge>
            {insight ? (
              <Badge>
                {insight.sentiment.charAt(0)}
                {insight.sentiment.slice(1).toLowerCase()}
              </Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            Uploaded {new Date(call.createdAt).toLocaleString()} · {call.uploadedBy.email}
          </p>
        </div>
        {insight ? (
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Overall score</p>
            <p className="font-heading text-4xl font-bold tabular-nums">{insight.overallScore.toFixed(1)}</p>
            <p className="text-muted-foreground text-xs">out of 10</p>
          </div>
        ) : null}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex w-full flex-wrap gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="player">Player &amp; transcript</TabsTrigger>
          <TabsTrigger value="scores">Scores &amp; questionnaire</TabsTrigger>
          <TabsTrigger value="notes">Notes &amp; actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Call summary</CardTitle>
              <CardDescription>AI-generated overview of the conversation</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">
                {insight?.summary ?? "Summary will appear after analysis completes."}
              </p>
            </CardContent>
          </Card>

          {insight ? (
            <CallOverviewCharts
              agentTalkPct={insight.agentTalkPct}
              customerTalkPct={insight.customerTalkPct}
              agentScores={agentScores ?? {}}
              questionnaire={questionnaire}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="player" className="mt-4 space-y-4">
          <CallAudioTranscript
            audioSrc={audioSrc}
            segmentsJson={call.transcript?.segments}
            fullText={call.transcript?.fullText ?? ""}
            durationSec={call.durationSec}
          />
        </TabsContent>

        <TabsContent value="scores" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent performance (1–10)</CardTitle>
              <CardDescription>Ratings for clarity, tone, product knowledge, and problem-solving</CardDescription>
            </CardHeader>
            <CardContent>
              {agentScores ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {AGENT_SCORE_KEYS.map(({ key, label }) => (
                    <li
                      key={key}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                    >
                      <span>{label}</span>
                      <span className="font-heading font-semibold tabular-nums">
                        {agentScores[key] ?? "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">Scores pending analysis.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Discovery questionnaire</CardTitle>
              <CardDescription>Key discovery themes and whether they came up on the call</CardDescription>
            </CardHeader>
            <CardContent>
              {questionnaire.length === 0 ? (
                <p className="text-muted-foreground text-sm">No questionnaire data yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Topic</TableHead>
                      <TableHead className="text-right">Asked?</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questionnaire.map((row) => (
                      <TableRow key={row.topic}>
                        <TableCell>{row.topic}</TableCell>
                        <TableCell className="text-right">{row.asked ? "Yes" : "No"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Keywords</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {keywords.length === 0 ? (
                <p className="text-muted-foreground text-sm">—</p>
              ) : (
                keywords.map((k) => (
                  <Badge key={k} variant="secondary">
                    {k}
                  </Badge>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Follow-up action items</CardTitle>
            </CardHeader>
            <CardContent>
              {actions.length === 0 ? (
                <p className="text-muted-foreground text-sm">None extracted yet.</p>
              ) : (
                <ul className="list-inside list-disc space-y-1 text-sm">
                  {actions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Positive observations</CardTitle>
              </CardHeader>
              <CardContent>
                {positive.length === 0 ? (
                  <p className="text-muted-foreground text-sm">—</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {positive.map((p) => (
                      <li key={p} className="leading-relaxed">
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Negative observations</CardTitle>
              </CardHeader>
              <CardContent>
                {negative.length === 0 ? (
                  <p className="text-muted-foreground text-sm">—</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {negative.map((n) => (
                      <li key={n} className="leading-relaxed">
                        {n}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {call.analysisJob && call.analysisJob.batches.length > 0 ? (
        <>
          <Separator />
          <div>
            <h3 className="font-heading text-sm font-semibold">Processing batches</h3>
            <p className="text-muted-foreground mt-1 text-xs">
              Per-step status when processing is split into batches
            </p>
            <Table className="mt-2">
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Retries</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {call.analysisJob.batches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>{b.batchIndex}</TableCell>
                    <TableCell>{b.status}</TableCell>
                    <TableCell>{b.retryCount}</TableCell>
                    <TableCell className="max-w-[240px] truncate text-xs text-destructive">
                      {b.errorMessage ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : null}
    </div>
  );
}
