import { createFileRoute, Outlet } from "@tanstack/react-router";

import { SiteShell } from "@/components/layout/site-shell";
import { getMessages } from "@/i18n/messages";

import { Route as Root } from "../__root";

export const Route = createFileRoute("/admin")({
  loader: () => getMessages("en"),
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow, noarchive" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <SiteShell admin {...Root.useLoaderData()} locale="en" messages={Route.useLoaderData()}>
      <Outlet />
    </SiteShell>
  );
}
