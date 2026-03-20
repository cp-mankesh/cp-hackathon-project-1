"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

type Props = {
  children: React.ReactNode;
  /** Resolved from server cookie for first paint alignment. */
  defaultTheme?: string;
};

export function AppProviders({ children, defaultTheme = "system" }: Props) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}
