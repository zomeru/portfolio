import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteNav } from "@/components/layout/site-nav";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { profile } from "@/data/profile";

import "./globals.css";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${profile.name} — ${profile.role}`,
    template: `%s — ${profile.name}`,
  },
  description:
    "Full-stack software engineer focused on building modern web applications and scalable systems.",
  openGraph: {
    title: `${profile.name} — ${profile.role}`,
    description:
      "Full-stack software engineer focused on building modern web applications and scalable systems.",
    type: "website",
    siteName: profile.name,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(geistSans.variable, geistMono.variable, "antialiased")}
    >
      <body>
        <ThemeProvider>
          <div className="flex min-h-dvh flex-col">
            <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 sm:px-8">
              <SiteHeader />
              <SiteNav />
              <main className="flex-1 py-12 sm:py-16">{children}</main>
              <SiteFooter />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
