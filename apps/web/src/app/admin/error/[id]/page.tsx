import { logError } from "@portfolio/api/logging";
import type { AdminErrorDetail } from "@portfolio/api/types";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/portfolio/page-header";
import { getAdminAccessSessionToken, isAdminAccessAuthenticated } from "@/lib/admin-access";
import { serverClient } from "@/lib/api-server";

import { AdminAccessGate } from "../../access-gate";
import { ErrorStatusForm } from "../error-status-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Error detail | Admin",
  robots: { index: false, follow: false, nocache: true },
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "long",
    timeZone: "UTC",
  }).format(new Date(value));
}

async function loadIssue(token: string, id: string) {
  try {
    const response = await serverClient.api.admin.errors[":id"].$get(
      { param: { id } },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (response.status === 404) return undefined;
    if (!response.ok) return null;
    const payload = (await response.json()) as { issue: AdminErrorDetail };
    return payload.issue;
  } catch (error) {
    logError("admin error issue could not be loaded", error, {
      operation: "web.admin.errors.loadIssue",
      issueId: id,
    });
    return null;
  }
}

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-background p-3 font-mono text-xs leading-relaxed">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default async function AdminErrorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const hasAccess = await isAdminAccessAuthenticated();
  if (!hasAccess) {
    return (
      <>
        <div aria-hidden="true" className="pointer-events-none select-none blur-sm">
          <PageHeader index="07" eyebrow="Admin error" title="Inspect error details." />
          <div className="mt-10 h-64 rounded-lg border border-border/70 bg-foreground/2.5" />
        </div>
        <AdminAccessGate redirectTo={`/admin/error/${id}`} />
      </>
    );
  }

  const token = await getAdminAccessSessionToken();
  const issue = token ? await loadIssue(token, id) : null;
  if (issue === undefined) notFound();

  return (
    <>
      <PageHeader index="07" eyebrow="Admin error" title="Inspect error details." />
      <Link
        href="/admin/error"
        className="mt-6 inline-block text-xs text-muted underline decoration-border underline-offset-4 hover:text-foreground"
      >
        Back to error issues
      </Link>

      {!issue ? (
        <p role="alert" className="mt-8 rounded-lg border border-border p-4 text-sm text-muted">
          This error issue could not be loaded.
        </p>
      ) : (
        <div className="mt-8 space-y-4">
          <section
            className="rounded-lg border border-border p-4 sm:p-5"
            aria-labelledby="overview"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 id="overview" className="text-sm font-medium">
                  Overview
                </h2>
                <p className="mt-3 break-words text-lg font-medium">
                  {issue.name}: {issue.message}
                </p>
              </div>
              <ErrorStatusForm id={issue.id} initialStatus={issue.status} />
            </div>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-xs text-muted">Severity</dt>
                <dd className="mt-1 capitalize">{issue.severity}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Occurrences</dt>
                <dd className="mt-1">{issue.occurrenceCount.toLocaleString("en")}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">First seen</dt>
                <dd className="mt-1">{formatDate(issue.firstSeenAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Last seen</dt>
                <dd className="mt-1">{formatDate(issue.lastSeenAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-border p-4 sm:p-5" aria-labelledby="source">
            <h2 id="source" className="text-sm font-medium">
              Source
            </h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted">Origin</dt>
                <dd className="mt-1 break-all font-mono text-xs">{issue.source ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Service / environment</dt>
                <dd className="mt-1">
                  {issue.service} · {issue.environment}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Error code</dt>
                <dd className="mt-1 font-mono text-xs">{issue.errorCode ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Fingerprint</dt>
                <dd className="mt-1 break-all font-mono text-xs">{issue.fingerprint}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-border p-4 sm:p-5" aria-labelledby="request">
            <h2 id="request" className="text-sm font-medium">
              Request
            </h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted">Route</dt>
                <dd className="mt-1 break-all font-mono text-xs">{issue.route ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Method</dt>
                <dd className="mt-1">{issue.method ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Request ID</dt>
                <dd className="mt-1 break-all font-mono text-xs">{issue.requestId ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">User agent</dt>
                <dd className="mt-1 break-words text-xs">{issue.userAgent ?? "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-border p-4 sm:p-5" aria-labelledby="stack">
            <h2 id="stack" className="text-sm font-medium">
              Stack trace
            </h2>
            <pre className="mt-3 max-h-[32rem] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-background p-3 font-mono text-xs leading-relaxed">
              {issue.stack ?? "No stack trace was available."}
            </pre>
          </section>

          <section className="rounded-lg border border-border p-4 sm:p-5" aria-labelledby="cause">
            <h2 id="cause" className="text-sm font-medium">
              Cause
            </h2>
            {issue.cause ? (
              <JsonBlock value={issue.cause} />
            ) : (
              <p className="mt-3 text-sm text-muted">No nested cause was captured.</p>
            )}
          </section>

          <section
            className="rounded-lg border border-border p-4 sm:p-5"
            aria-labelledby="metadata"
          >
            <h2 id="metadata" className="text-sm font-medium">
              Metadata
            </h2>
            <JsonBlock value={issue.metadata} />
          </section>
        </div>
      )}
    </>
  );
}
