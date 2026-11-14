import { createFileRoute, Outlet } from "@tanstack/react-router";

import { SiteShell } from "@/components/layout/site-shell";
import { getMessages } from "@/i18n/messages";
import { getSiteData } from "@/lib/site.functions";

export const Route = createFileRoute("/admin")({
  loader: async () => {
    const [messages, site] = await Promise.all([
      getMessages("en"),
      getSiteData().catch(() => ({ profile: null, techStack: [] })),
    ]);
    return { messages, site };
  },
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow, noarchive" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { messages, site } = Route.useLoaderData();
  return (
    <SiteShell admin {...site} locale="en" messages={messages}>
      <Outlet />
    </SiteShell>
  );
}
