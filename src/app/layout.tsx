import type { Metadata } from "next";
import { Geist_Mono, Roboto, Roboto_Condensed } from "next/font/google";
import { cookies } from "next/headers";
import { AppProviders } from "@/context/app-providers";
import { THEME_COOKIE } from "@/constants/theme";
import { cn } from "@/lib/utils";
import "./globals.css";

/** Body / UI copy — Roboto. */
const fontBody = Roboto({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "700"],
  display: "swap",
  adjustFontFallback: true,
});

/** Headings — Roboto Condensed. */
const fontHeading = Roboto_Condensed({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "700"],
  display: "swap",
  adjustFontFallback: true,
});

const fontMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Call Intelligence",
    template: "%s · Call Intelligence",
  },
  description: "AI-powered sales call analysis — transcripts, sentiment, and coaching insights.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(THEME_COOKIE)?.value;
  const defaultTheme =
    themeCookie === "dark" || themeCookie === "light" ? themeCookie : "system";
  const isDarkHtml = themeCookie === "dark";

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        fontBody.variable,
        fontHeading.variable,
        fontMono.variable,
        "h-full antialiased",
        isDarkHtml && "dark",
      )}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col font-sans">
        <AppProviders defaultTheme={defaultTheme}>{children}</AppProviders>
      </body>
    </html>
  );
}
