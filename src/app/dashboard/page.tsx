import { notFound } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { PageHeader } from "@/components/layout/page-header";
import { routes } from "@/constants/routes";
import { getSessionUser } from "@/lib/auth/session";
import { userCan } from "@/lib/permissions/user-can";
import { cn } from "@/lib/utils";
import { DashboardCharts } from "@/modules/calls/components/dashboard-charts";
import { DashboardStatsCards } from "@/modules/calls/components/dashboard-stats-cards";
import { getDashboardStats } from "@/modules/calls/server/call.service";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    notFound();
  }
  if (!userCan(user, "calls", "r")) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          description="You don’t have permission to view call intelligence metrics. Ask an admin to update your role."
        />
      </>
    );
  }

  const stats = await getDashboardStats(user.organisationId);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Organisation-wide metrics from analysed calls. They update as you upload recordings and processing completes."
      />
      <div className="mb-8 flex flex-wrap gap-3">
        {userCan(user, "calls", "c") ? (
          <Link href={routes.callsUpload} className={cn(buttonVariants())}>
            Upload call
          </Link>
        ) : null}
        <Link href={routes.calls} className={cn(buttonVariants({ variant: "outline" }))}>
          View all calls
        </Link>
      </div>
      <DashboardStatsCards stats={stats} />
      <DashboardCharts stats={stats} />
    </>
  );
}
