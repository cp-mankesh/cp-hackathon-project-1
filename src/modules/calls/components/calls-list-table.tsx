import Link from "next/link";
import type { Call, CallInsight, User, AnalysisJob } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { callDetail, routes } from "@/constants/routes";

type Row = Call & {
  uploadedBy: Pick<User, "id" | "name" | "email">;
  insight: Pick<CallInsight, "sentiment" | "overallScore"> | null;
  analysisJob: Pick<AnalysisJob, "status"> | null;
};

type Props = {
  calls: Row[];
};

export function CallsListTable({ calls }: Props) {
  if (calls.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No calls yet.{" "}
        <Link href={routes.callsUpload} className="text-primary font-medium underline-offset-4 hover:underline">
          Upload a recording
        </Link>{" "}
        to start analysis.
      </p>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">
                {c.title || c.originalFileName}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{c.status}</Badge>
                {c.analysisJob ? (
                  <span className="text-muted-foreground ml-2 text-xs">job: {c.analysisJob.status}</span>
                ) : null}
              </TableCell>
              <TableCell>
                {c.insight ? c.insight.overallScore.toFixed(1) : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {new Date(c.createdAt).toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={callDetail(c.id)}
                  className="text-primary text-sm font-medium underline-offset-4 hover:underline"
                >
                  View
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
