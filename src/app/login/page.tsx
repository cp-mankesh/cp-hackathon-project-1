import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AuthCard } from "@/components/auth/auth-card";
import { buttonVariants } from "@/components/ui/button-variants";
import { routes } from "@/constants/routes";
import { LoginForm } from "@/modules/auth";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  return (
    <div className="bg-muted/30 flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <Link href={routes.home} className="font-heading text-muted-foreground text-sm font-medium hover:text-foreground">
          ← Back
        </Link>
        <ThemeToggle />
      </header>
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <AuthCard title="Sign in" description="Use your work email and password.">
          <LoginForm />
        </AuthCard>
        <Link
          href={routes.register}
          className={cn(buttonVariants({ variant: "link" }), "mt-6")}
        >
          Create a new organisation
        </Link>
      </div>
    </div>
  );
}
