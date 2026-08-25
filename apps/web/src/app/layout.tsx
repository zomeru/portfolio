import { getPublicProfile, getPublicTechStack } from "@portfolio/api/public-portfolio";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteNav } from "@/components/layout/site-nav";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { siteUrl } from "@/lib/metadata";

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

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getPublicProfile();
  const name = profile?.name || "Portfolio";
  const role = profile?.role || "Software Engineer";
  const description = profile?.biography || "Personal portfolio.";

  return {
    metadataBase: siteUrl,
    applicationName: name,
    title: { default: `${name} — ${role}`, template: `%s — ${name}` },
    description,
    authors: [{ name, url: siteUrl }],
    creator: name,
    publisher: name,
    alternates: { canonical: "/" },
    openGraph: {
      title: `${name} — ${role}`,
      description,
      locale: "en_US",
      type: "website",
      siteName: name,
      url: siteUrl,
    },
    twitter: { card: "summary_large_image", title: `${name} — ${role}`, description },
  };
}

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [profile, techStack] = await Promise.all([getPublicProfile(), getPublicTechStack()]);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(geistSans.variable, geistMono.variable, "antialiased")}
    >
      <body>
        <ThemeProvider>
          <a
            href="#main-content"
            className="sr-only fixed left-4 top-4 z-50 rounded-sm bg-foreground px-4 py-2 text-sm font-medium text-background focus:not-sr-only"
          >
            Skip to content
          </a>
          <div className="flex min-h-dvh flex-col">
            <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 sm:px-8">
              <SiteHeader profile={profile} techStack={techStack.groups} />
              <SiteNav />
              <main id="main-content" tabIndex={-1} className="flex-1 scroll-mt-4 py-12 sm:py-16">
                {children}
              </main>
              <SiteFooter profile={profile} />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
