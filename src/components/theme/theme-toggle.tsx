"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore, useTransition } from "react";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setThemeCookieAction } from "@/app/actions/theme";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

/** Theme switcher: syncs cookie (server) + next-themes (client) to avoid wrong theme on refresh. */
export function ThemeToggle() {
  const { setTheme } = useTheme();
  const isClient = useIsClient();
  const [pending, startTransition] = useTransition();

  if (!isClient) {
    return (
      <span
        className={cn(buttonVariants({ variant: "ghost", size: "icon-lg" }), "relative size-9 opacity-50")}
        aria-label="Theme"
      >
        <Sun className="size-4" />
      </span>
    );
  }

  function apply(next: "light" | "dark" | "system") {
    setTheme(next);
    startTransition(async () => {
      await setThemeCookieAction(next);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending}
        aria-label="Toggle theme"
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon-lg" }),
          "relative size-9 disabled:opacity-50",
        )}
      >
        <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => apply("light")}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => apply("dark")}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => apply("system")}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
