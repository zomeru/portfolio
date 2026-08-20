import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteNav } from "@/components/layout/site-nav";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { portableTextToPlainText } from "@/lib/sanity/portable-text";
import { getProfile } from "@/lib/sanity/services/profile";
import { getTechStack } from "@/lib/sanity/services/tech-stack";

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
  const profile = await getProfile();
  const name = profile?.name || "Portfolio";
  const role = profile?.role || "Software Engineer";
  const description = portableTextToPlainText(profile?.biography) || "Personal portfolio.";

  return {
    title: { default: `${name} — ${role}`, template: `%s — ${name}` },
    description,
    openGraph: { title: `${name} — ${role}`, description, type: "website", siteName: name },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [profile, techStack] = await Promise.all([getProfile(), getTechStack()]);

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
              <SiteHeader profile={profile} techStack={techStack} />
              <SiteNav />
              <main className="flex-1 py-12 sm:py-16">{children}</main>
              <SiteFooter profile={profile} />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
