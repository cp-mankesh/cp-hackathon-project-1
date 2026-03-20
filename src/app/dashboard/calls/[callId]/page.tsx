import { notFound } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { PageHeader } from "@/components/layout/page-header";
import { routes } from "@/constants/routes";
import { getSessionUser } from "@/lib/auth/session";
import { userCan } from "@/lib/permissions/user-can";
import { cn } from "@/lib/utils";
import { CallDetailView } from "@/modules/calls/components/call-detail-view";
import { getCallForOrganisation } from "@/modules/calls/server/call.service";

type PageProps = { params: Promise<{ callId: string }> };

export default async function CallDetailPage({ params }: PageProps) {
  const { callId } = await params;
  const user = await getSessionUser();
  if (!user) {
    notFound();
  }
  if (!userCan(user, "calls", "r")) {
    notFound();
  }

  const call = await getCallForOrganisation(callId, user.organisationId);
  if (!call) {
    notFound();
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href={routes.calls} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          ← All calls
        </Link>
      </div>
      <PageHeader title={call.title || call.originalFileName} description="Transcript, scores, discovery coverage, and follow-ups for this call." />
      <CallDetailView call={call} />
    </>
  );
}
