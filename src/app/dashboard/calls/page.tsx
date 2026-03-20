import { notFound } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { PageHeader } from "@/components/layout/page-header";
import { routes } from "@/constants/routes";
import { getSessionUser } from "@/lib/auth/session";
import { userCan } from "@/lib/permissions/user-can";
import { cn } from "@/lib/utils";
import { CallsListTable } from "@/modules/calls/components/calls-list-table";
import { listCallsForOrganisation } from "@/modules/calls/server/call.service";

export default async function CallsListPage() {
  const user = await getSessionUser();
  if (!user) {
    notFound();
  }
  if (!userCan(user, "calls", "r")) {
    notFound();
  }

  const calls = await listCallsForOrganisation(user.organisationId);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Calls"
          description="Recordings for your organisation. Open a call to see transcript, scores, and insights."
        />
        {userCan(user, "calls", "c") ? (
          <Link href={routes.callsUpload} className={cn(buttonVariants())}>
            Upload
          </Link>
        ) : null}
      </div>
      <CallsListTable calls={calls} />
    </>
  );
}
