import { GoogleTagManager } from "@next/third-parties/google";
import { getPublicProfile, getPublicTechStack } from "@portfolio/api/public-portfolio";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";

import { GoogleAnalyticsViaGtm } from "@/components/analytics/google-analytics-via-gtm";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteNav } from "@/components/layout/site-nav";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { siteUrl } from "@/lib/metadata";
import { cn } from "@/lib/utils";

import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

const SHOULD_RENDER_VERCEL_INSIGHTS = process.env.VERCEL === "1";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [profile, techStack, messages] = await Promise.all([
    getPublicProfile(),
    getPublicTechStack(),
    getMessages(),
  ]);
  const clientMessages = {
    Assistant: messages.Assistant,
    Blogs: messages.Blogs,
    Common: messages.Common,
    Contact: messages.Contact,
    Errors: messages.Errors,
    Github: messages.Github,
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(geistSans.variable, geistMono.variable, "antialiased")}
    >
      <GoogleTagManager gtmId="GTM-PV9CX97P" />
      <body>
        <NextIntlClientProvider locale="en" messages={clientMessages}>
          <ThemeProvider>
            <ServiceWorkerRegistration />
            <a
              href="#main-content"
              className="sr-only fixed top-4 left-4 z-50 rounded-sm bg-foreground px-4 py-2 text-sm font-medium text-background focus:not-sr-only"
            >
              Skip to content
            </a>
            <div className="flex min-h-dvh flex-col">
              <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 sm:px-8">
                <SiteHeader
                  profile={profile}
                  showLanguagePicker={false}
                  techStack={techStack.groups}
                />
                <SiteNav showLanguagePicker={false} />
                <main id="main-content" tabIndex={-1} className="flex-1 scroll-mt-4 py-12 sm:py-16">
                  {children}
                </main>
                <SiteFooter profile={profile} />
              </div>
            </div>
          </ThemeProvider>
        </NextIntlClientProvider>
        {SHOULD_RENDER_VERCEL_INSIGHTS ? <Analytics /> : null}
        {SHOULD_RENDER_VERCEL_INSIGHTS ? <SpeedInsights /> : null}
      </body>
      <GoogleAnalyticsViaGtm />
    </html>
  );
}
