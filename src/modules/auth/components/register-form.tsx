"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { routes } from "@/constants/routes";
import { registerCompanyAction } from "@/modules/auth/actions/auth-actions";
import type { AuthActionState } from "@/modules/auth/actions/auth-action.types";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerCompanyAction,
    undefined as AuthActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="organisationName">Company name</Label>
        <Input
          id="organisationName"
          name="organisationName"
          type="text"
          required
          minLength={2}
          placeholder="Acme Sales"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Your name (optional)</Label>
        <Input id="name" name="name" type="text" autoComplete="name" placeholder="Jane Doe" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Work email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
        <p className="text-muted-foreground text-xs">At least 8 characters.</p>
      </div>
      {state?.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating…" : "Create organisation"}
      </Button>
      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <Link href={routes.login} className="text-primary font-medium underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
