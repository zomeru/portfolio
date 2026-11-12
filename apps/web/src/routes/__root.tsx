import { createRootRoute, HeadContent, Scripts, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { GoogleAnalyticsViaGtm } from "@/components/analytics/google-analytics-via-gtm";
import GlobalError from "@/components/layout/global-error";
import { DefaultNotFound } from "@/components/layout/not-found";
import { defaultLocale, isLocale } from "@/i18n/routing";
import { getSiteData } from "@/lib/site.functions";

import appCss from "@/globals.css?url";

export const Route = createRootRoute({
  loader: () => getSiteData(),
  staleTime: 30_000,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "color-scheme", content: "light dark" },
      { name: "theme-color", media: "(prefers-color-scheme: light)", content: "#fafafa" },
      { name: "theme-color", media: "(prefers-color-scheme: dark)", content: "#0a0a0a" },
      { name: "google-site-verification", content: "vIm46RcPpRP4YQjS20F6RUACLwKggpLpEwLKn3rMXVw" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", href: "/favicon.ico" },
      { rel: "icon", href: "/icon0.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/icon1.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-icon.png" },
    ],
  }),
  shellComponent: RootDocument,
  errorComponent: GlobalError,
  notFoundComponent: DefaultNotFound,
});

function RootDocument({ children }: { children: ReactNode }) {
  const first = useLocation({ select: ({ pathname }) => pathname.split("/")[1] });
  const locale = first && isLocale(first) ? first : defaultLocale;
  return (
    <html lang={locale} className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <GoogleAnalyticsViaGtm />
        <Scripts />
      </body>
    </html>
  );
}
