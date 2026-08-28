import { logError } from "@portfolio/api/logging";
import type { Metadata } from "next";

import { PageHeader } from "@/components/portfolio/page-header";
import { isAdminAccessAuthenticated } from "@/lib/admin-access";
import { getAdminSessionToken } from "@/lib/admin-session";
import { serverClient } from "@/lib/api-server";

import { AdminAccessGate } from "./access-gate";
import { logoutAdmin, logoutAdminAccess } from "./actions";
import { GenerationForm } from "./generation-form";
import { KnowledgeIndexForm } from "./knowledge-index-form";
import { LoginForm } from "./login-form";
import { NotificationRetryForm } from "./notification-retry-form";
import { WebhookManager, type WebhookSummary } from "./webhook-manager";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Admin",
  description: "Private portfolio publishing controls.",
  robots: { index: false, follow: false },
};

type KnowledgeIndexStatus = {
  documents: number;
  chunks: number;
  latestRun: null | {
    status: string;
    startedAt: string;
    completedAt: string | null;
  };
};

type NotificationSummary = {
  counts: { email: number; push: number; webhook: number };
  latestEvent: null | {
    occurredAt: string;
    payload: { data: { blog: { title: string } } };
  };
  deliveries: Array<{
    channel: "email" | "push" | "webhook";
    status: "pending" | "processing" | "delivered" | "failed";
  }>;
};

async function loadKnowledgeStatus(token: string) {
  try {
    const response = await serverClient.api.admin.ai.status.$get(
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!response.ok) return null;
    return (await response.json()) as KnowledgeIndexStatus;
  } catch (error) {
    logError("admin knowledge status could not be loaded", error, {
      operation: "web.admin.loadKnowledgeStatus",
    });
    return null;
  }
}

async function loadNotificationSummary(token: string) {
  try {
    const response = await serverClient.api.notifications.admin.summary.$get(
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!response.ok) return null;
    return (await response.json()) as NotificationSummary;
  } catch (error) {
    logError("admin notification summary could not be loaded", error, {
      operation: "web.admin.loadNotificationSummary",
    });
    return null;
  }
}

async function loadWebhookSummaries(token: string) {
  try {
    const response = await serverClient.api.notifications.webhooks.$get(
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as { webhooks: WebhookSummary[] };
    return payload.webhooks;
  } catch (error) {
    logError("admin webhook destinations could not be loaded", error, {
      operation: "web.admin.loadWebhookSummaries",
    });
    return null;
  }
}

function deliveryCounts(summary: NotificationSummary, channel: "email" | "push" | "webhook") {
  const rows = summary.deliveries.filter((delivery) => delivery.channel === channel);
  return {
    delivered: rows.filter((delivery) => delivery.status === "delivered").length,
    failed: rows.filter((delivery) => delivery.status === "failed").length,
    pending: rows.filter(
      (delivery) => delivery.status === "pending" || delivery.status === "processing",
    ).length,
  };
}

function formatIndexDate(value: string | null | undefined) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default async function AdminPage() {
  const hasPageAccess = await isAdminAccessAuthenticated();
  if (!hasPageAccess) {
    return (
      <>
        <div aria-hidden="true" className="pointer-events-none select-none blur-sm">
          <PageHeader index="06" eyebrow="Admin" title="Manage portfolio automation." />
          <div className="mt-10 h-40 rounded-lg border border-border/70 bg-foreground/2.5" />
          <div className="mt-4 h-40 rounded-lg border border-border/70 bg-foreground/2.5" />
        </div>
        <AdminAccessGate />
      </>
    );
  }

  const [publishingToken, reindexToken] = await Promise.all([
    getAdminSessionToken("blog-generation"),
    getAdminSessionToken("ai-reindex"),
  ]);
  const [status, notificationSummary, webhookSummaries] = await Promise.all([
    reindexToken ? loadKnowledgeStatus(reindexToken) : null,
    publishingToken ? loadNotificationSummary(publishingToken) : null,
    publishingToken ? loadWebhookSummaries(publishingToken) : null,
  ]);

  return (
    <>
      <PageHeader index="06" eyebrow="Admin" title="Manage portfolio automation." />

      <div className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-border/70 bg-foreground/2.5 px-4 py-3">
        <div>
          <p className="text-sm font-medium">Page access</p>
          <p className="mt-1 text-xs text-muted">Admin page unlocked on this browser</p>
        </div>
        <form action={logoutAdminAccess}>
          <button
            type="submit"
            className="min-h-10 rounded-md border border-border px-3 text-xs text-muted transition-colors duration-150 hover:text-foreground motion-reduce:transition-none"
          >
            Lock page
          </button>
        </form>
      </div>

      <section
        aria-labelledby="publishing-heading"
        className="mt-10 rounded-lg border border-border/70 bg-foreground/2.5 p-4 sm:p-5"
      >
        <h2 id="publishing-heading" className="text-sm font-medium">
          Blog publishing
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Generate and publish portfolio articles with the configured provider.
        </p>

        {publishingToken ? (
          <div className="mt-4 divide-y divide-border/70">
            <div className="flex min-h-16 items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium">Access</p>
                <p className="mt-1 text-xs text-muted">Publishing unlocked on this browser</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">Active</span>
                <form action={logoutAdmin}>
                  <input type="hidden" name="capability" value="blog-generation" />
                  <button
                    type="submit"
                    className="min-h-10 rounded-md border border-border px-3 text-xs text-muted transition-colors duration-150 hover:text-foreground motion-reduce:transition-none"
                  >
                    Lock
                  </button>
                </form>
              </div>
            </div>

            <div className="flex min-h-16 items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium">Provider</p>
                <p className="mt-1 text-xs text-muted">Structured article generation</p>
              </div>
              <p className="text-end text-sm">Google Gemini</p>
            </div>

            <GenerationForm />
          </div>
        ) : (
          <LoginForm capability="blog-generation" />
        )}
      </section>

      {publishingToken ? (
        <section
          aria-labelledby="notifications-heading"
          className="mt-4 rounded-lg border border-border/70 bg-foreground/2.5 p-4 sm:p-5"
        >
          <h2 id="notifications-heading" className="text-sm font-medium">
            Delivery operations
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Monitor publication notifications, retry deliveries, and manage webhooks.
          </p>
          <div className="mt-4 divide-y divide-border/70">
            <div className="grid grid-cols-3 gap-4 py-4 text-sm">
              <div>
                <p className="text-xs text-muted">Email</p>
                <p className="mt-1 font-mono">{notificationSummary?.counts.email ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Push</p>
                <p className="mt-1 font-mono">{notificationSummary?.counts.push ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Webhooks</p>
                <p className="mt-1 font-mono">{notificationSummary?.counts.webhook ?? "—"}</p>
              </div>
            </div>
            <div className="py-4 text-sm">
              <p className="text-xs text-muted">Last publication</p>
              <p className="mt-1 font-medium">
                {notificationSummary?.latestEvent?.payload.data.blog.title ?? "No events recorded"}
              </p>
              {notificationSummary?.latestEvent ? (
                <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                  {(["email", "push", "webhook"] as const).map((channel) => {
                    const counts = deliveryCounts(notificationSummary, channel);
                    return (
                      <div key={channel} className="border-l-2 border-border pl-3">
                        <dt className="font-mono text-[0.6875rem] uppercase tracking-widest text-muted">
                          {channel}
                        </dt>
                        <dd className="mt-2 grid grid-cols-3 gap-3">
                          <span>
                            <span className="block font-mono text-sm tabular-nums text-foreground">
                              {counts.delivered}
                            </span>
                            <span className="mt-0.5 block text-[0.6875rem] text-muted">
                              Delivered
                            </span>
                          </span>
                          <span>
                            <span className="block font-mono text-sm tabular-nums text-foreground">
                              {counts.failed}
                            </span>
                            <span className="mt-0.5 block text-[0.6875rem] text-muted">Failed</span>
                          </span>
                          <span>
                            <span className="block font-mono text-sm tabular-nums text-foreground">
                              {counts.pending}
                            </span>
                            <span className="mt-0.5 block text-[0.6875rem] text-muted">
                              Pending
                            </span>
                          </span>
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              ) : null}
            </div>
            <NotificationRetryForm />
          </div>
          <WebhookManager
            webhooks={webhookSummaries ?? []}
            loadFailed={webhookSummaries === null}
          />
        </section>
      ) : null}

      <section
        aria-labelledby="knowledge-heading"
        className="mt-4 rounded-lg border border-border/70 bg-foreground/2.5 p-4 sm:p-5"
      >
        <h2 id="knowledge-heading" className="text-sm font-medium">
          AI knowledge index
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Inspect and refresh the published portfolio data available to Zomer AI.
        </p>
        {reindexToken ? (
          <div className="mt-4 divide-y divide-border/70">
            <div className="flex min-h-16 items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium">Access</p>
                <p className="mt-1 text-xs text-muted">AI indexing unlocked on this browser</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">Active</span>
                <form action={logoutAdmin}>
                  <input type="hidden" name="capability" value="ai-reindex" />
                  <button
                    type="submit"
                    className="min-h-10 rounded-md border border-border px-3 text-xs text-muted transition-colors duration-150 hover:text-foreground motion-reduce:transition-none"
                  >
                    Lock
                  </button>
                </form>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 py-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted">Documents</p>
                <p className="mt-1 font-mono">{status?.documents ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Chunks</p>
                <p className="mt-1 font-mono">{status?.chunks ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Latest run</p>
                <p className="mt-1 font-mono capitalize">
                  {status?.latestRun?.status ?? "Unavailable"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">Last indexed</p>
                <p className="mt-1 font-mono">
                  {status?.latestRun?.completedAt
                    ? `${formatIndexDate(status.latestRun.completedAt)} UTC`
                    : "Never"}
                </p>
              </div>
            </div>
            <KnowledgeIndexForm />
          </div>
        ) : (
          <LoginForm capability="ai-reindex" />
        )}
      </section>
    </>
  );
}
