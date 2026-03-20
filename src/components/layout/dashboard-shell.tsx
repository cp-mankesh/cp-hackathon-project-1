"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Organisation, Role, User } from "@prisma/client";
import { LayoutDashboard, Phone, UploadCloud, Users } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { routes } from "@/constants/routes";
import { canCrud } from "@/lib/permissions/check";
import { logoutAction } from "@/modules/auth/actions/auth-actions";
import { cn } from "@/lib/utils";

export type SessionUser = User & {
  organisation: Organisation;
  assignedRole: Role | null;
};

type Props = {
  user: SessionUser;
  children: React.ReactNode;
};

export function DashboardShell({ user, children }: Props) {
  const pathname = usePathname();
  const canSeeUsers = canCrud(user.assignedRole?.permissions, "users", "r");
  const canSeeCalls = canCrud(user.assignedRole?.permissions, "calls", "r");
  const canUploadCalls = canCrud(user.assignedRole?.permissions, "calls", "c");

  const nav = [
    { href: routes.dashboard, label: "Dashboard", icon: LayoutDashboard, show: true },
    { href: routes.calls, label: "Calls", icon: Phone, show: canSeeCalls },
    { href: routes.callsUpload, label: "Upload", icon: UploadCloud, show: canUploadCalls },
    { href: routes.users, label: "Users", icon: Users, show: canSeeUsers },
  ].filter((i) => i.show);

  return (
    <div className="bg-background flex min-h-screen">
      <aside className="bg-sidebar text-sidebar-foreground hidden w-56 shrink-0 flex-col border-r md:flex">
        <div className="p-4">
          <Link href={routes.dashboard} className="font-heading text-sidebar-primary-foreground font-semibold">
            <span className="text-primary">Call Intelligence</span>
          </Link>
          <p className="text-sidebar-foreground/70 mt-1 truncate text-xs">{user.organisation.name}</p>
        </div>
        <Separator />
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4 backdrop-blur">
          <p className="text-muted-foreground truncate text-sm md:hidden">{user.organisation.name}</p>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-muted-foreground hidden max-w-[200px] truncate text-sm sm:inline">{user.email}</span>
            <ThemeToggle />
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">
                Log out
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
