import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";

import GlobalError from "@/components/layout/global-error";
import { DefaultNotFound, LocalizedNotFound } from "@/components/layout/not-found";
import RouteError from "@/components/layout/route-error";
import { SiteShell } from "@/components/layout/site-shell";
import { getMessages } from "@/i18n/messages";
import { defaultLocale, isLocale } from "@/i18n/routing";
import { getSiteData } from "@/lib/site.functions";

export const Route = createFileRoute("/{-$locale}")({
  beforeLoad: async ({ params }) => {
    const locale = params.locale ?? defaultLocale;
    if (!isLocale(locale)) throw notFound({ routeId: "__root__" });
    return { locale, messages: await getMessages(locale) };
  },
  loader: () => getSiteData(),
  notFoundComponent: () => (
    <PublicBoundary fallback={<DefaultNotFound />}>
      <LocalizedNotFound />
    </PublicBoundary>
  ),
  errorComponent: (props) => (
    <PublicBoundary fallback={<GlobalError {...props} />}>
      <RouteError {...props} />
    </PublicBoundary>
  ),
  component: PublicLayout,
});

function PublicLayout() {
  const { locale, messages } = Route.useRouteContext();
  return (
    <SiteShell {...Route.useLoaderData()} locale={locale} messages={messages}>
      <Outlet />
    </SiteShell>
  );
}

function PublicBoundary({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const context = Route.useRouteContext();
  const site = Route.useLoaderData();
  if (!context.messages || !site) return fallback;
  return (
    <SiteShell {...site} locale={context.locale} messages={context.messages}>
      {children}
    </SiteShell>
  );
}
