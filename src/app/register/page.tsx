import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AuthCard } from "@/components/auth/auth-card";
import { buttonVariants } from "@/components/ui/button-variants";
import { routes } from "@/constants/routes";
import { RegisterForm } from "@/modules/auth";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  return (
    <div className="bg-muted/30 flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <Link href={routes.home} className="font-heading text-muted-foreground text-sm font-medium hover:text-foreground">
          ← Back
        </Link>
        <ThemeToggle />
      </header>
      <div className="flex flex-1 flex-col items-center justify-center p-4 py-10">
        <AuthCard
          title="Create your organisation"
          description="You will be the organisation admin. Invite teammates and set their roles from Users after you sign in."
        >
          <RegisterForm />
        </AuthCard>
        <Link href={routes.login} className={cn(buttonVariants({ variant: "link" }), "mt-6")}>
          Already have an account?
        </Link>
      </div>
    </div>
  );
}
