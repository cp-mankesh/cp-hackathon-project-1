import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { routes } from "@/constants/routes";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="from-background via-background to-muted/30 flex min-h-full flex-1 flex-col bg-gradient-to-b">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <span className="font-heading text-lg font-semibold text-primary">Call Intelligence</span>
          <div className="flex items-center gap-2">
            <Link href={routes.login} className={cn(buttonVariants({ variant: "ghost" }))}>
              Sign in
            </Link>
            <Link href={routes.register} className={cn(buttonVariants())}>
              Get started
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-3xl flex-1 flex-col justify-center px-4 py-16 text-center">
        <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          Turn conversations into intelligence
        </h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-lg">
          Upload sales calls, get transcripts and AI insights — sentiment, agent scoring, discovery coverage, and
          follow-ups. Built for multi-tenant teams with role-based access.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href={routes.register} className={cn(buttonVariants({ size: "lg" }))}>
            Register your company
          </Link>
          <Link href={routes.login} className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
            Sign in
          </Link>
        </div>
      </main>
    </div>
  );
}
