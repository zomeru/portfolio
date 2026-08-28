import { logError } from "@portfolio/api/logging";
import type {
  AdminErrorIssuePage,
  AdminErrorSeverity,
  AdminErrorStatus,
} from "@portfolio/api/types";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/portfolio/page-header";
import { getAdminAccessSessionToken, isAdminAccessAuthenticated } from "@/lib/admin-access";
import { serverClient } from "@/lib/api-server";

import { AdminAccessGate } from "../access-gate";
import { logoutAdminAccess } from "../actions";
import { ErrorFilters } from "./error-filters";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Error monitoring | Admin",
  description: "Private application error monitoring.",
  robots: { index: false, follow: false, nocache: true },
};

type ErrorSearchParams = {
  cursor?: string;
  q?: string;
  severity?: string;
  status?: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

function pageUrl(options: {
  cursor?: string;
  q?: string;
  severity?: AdminErrorSeverity;
  status?: AdminErrorStatus;
}) {
  const query = new URLSearchParams();
  if (options.cursor) query.set("cursor", options.cursor);
  if (options.q) query.set("q", options.q);
  if (options.severity) query.set("severity", options.severity);
  if (options.status) query.set("status", options.status);
  const value = query.toString();
  return value ? `/admin/error?${value}` : "/admin/error";
}

async function loadIssues(
  token: string,
  options: {
    cursor?: string;
    q?: string;
    severity?: AdminErrorSeverity;
    status?: AdminErrorStatus;
  },
) {
  try {
    const response = await serverClient.api.admin.errors.$get(
      {
        query: {
          ...(options.cursor ? { cursor: options.cursor } : {}),
          ...(options.q ? { q: options.q } : {}),
          ...(options.severity ? { severity: options.severity } : {}),
          ...(options.status ? { status: options.status } : {}),
        },
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!response.ok) return null;
    return (await response.json()) as AdminErrorIssuePage;
  } catch (error) {
    logError("admin error issues could not be loaded", error, {
      operation: "web.admin.errors.loadIssues",
    });
    return null;
  }
}

export default async function AdminErrorPage({
  searchParams,
}: {
  searchParams: Promise<ErrorSearchParams>;
}) {
  const hasAccess = await isAdminAccessAuthenticated();
  if (!hasAccess) {
    return (
      <>
        <div aria-hidden="true" className="pointer-events-none select-none blur-sm">
          <PageHeader index="07" eyebrow="Admin" title="Inspect application errors." />
          <div className="mt-10 h-64 rounded-lg border border-border/70 bg-foreground/2.5" />
        </div>
        <AdminAccessGate redirectTo="/admin/error" />
      </>
    );
  }

  const token = await getAdminAccessSessionToken();
  const raw = await searchParams;
  const status = ["open", "resolved", "ignored"].includes(raw.status ?? "")
    ? (raw.status as AdminErrorStatus)
    : undefined;
  const severity = ["error", "warning"].includes(raw.severity ?? "")
    ? (raw.severity as AdminErrorSeverity)
    : undefined;
  const q = raw.q?.trim().slice(0, 200) || undefined;
  const cursor = raw.cursor?.slice(0, 512) || undefined;
  const page = token
    ? await loadIssues(token, {
        ...(cursor ? { cursor } : {}),
        ...(q ? { q } : {}),
        ...(severity ? { severity } : {}),
        ...(status ? { status } : {}),
      })
    : null;

  return (
    <>
      <PageHeader index="07" eyebrow="Admin" title="Inspect application errors." />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin"
          className="text-xs text-muted underline decoration-border underline-offset-4 hover:text-foreground"
        >
          Back to admin
        </Link>
        <form action={logoutAdminAccess}>
          <button
            type="submit"
            className="min-h-10 rounded-md border border-border px-3 text-xs text-muted hover:text-foreground"
          >
            Lock admin
          </button>
        </form>
      </div>

      <ErrorFilters
        key={`${status ?? "all"}:${severity ?? "all"}:${q ?? ""}`}
        initialQuery={q}
        initialSeverity={severity}
        initialStatus={status}
      />

      <section aria-labelledby="error-list-heading" className="mt-6">
        <h2 id="error-list-heading" className="sr-only">
          Error issues
        </h2>
        {!page ? (
          <p role="alert" className="rounded-lg border border-border p-4 text-sm text-muted">
            Error issues could not be loaded. Check the database and try again.
          </p>
        ) : page.issues.length === 0 ? (
          <div className="rounded-lg border border-border p-8 text-center text-sm text-muted">
            <p>No error issues match these filters.</p>
            {q || severity || status ? (
              <Link
                href="/admin/error"
                className="mt-3 inline-block underline decoration-border underline-offset-4 hover:text-foreground"
              >
                Clear filters
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border">
            {page.issues.map((issue) => (
              <Link
                key={issue.id}
                href={`/admin/error/${issue.id}`}
                className="grid gap-2 p-4 transition-colors hover:bg-foreground/2.5 sm:grid-cols-[auto_1fr_auto] sm:items-center"
              >
                <span
                  className={`w-fit rounded-full px-2 py-1 font-mono text-[0.6875rem] uppercase tracking-wider ${
                    issue.severity === "error"
                      ? "bg-red-500/10 text-red-700 dark:text-red-300"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  }`}
                >
                  {issue.severity}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {issue.name}: {issue.message}
                  </span>
                  <span className="mt-1 block truncate text-xs text-muted">
                    {issue.route ?? issue.source ?? issue.service}
                    {issue.errorCode ? ` · ${issue.errorCode}` : ""}
                  </span>
                </span>
                <span className="text-left text-xs text-muted sm:text-right">
                  <span className="block capitalize">{issue.status}</span>
                  <span className="mt-1 block">
                    {issue.occurrenceCount.toLocaleString("en")} occurrence
                    {issue.occurrenceCount === 1 ? "" : "s"} · {formatDate(issue.lastSeenAt)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {page?.nextCursor ? (
        <div className="mt-6 flex items-center justify-between gap-3">
          <Link
            href={pageUrl({
              ...(q ? { q } : {}),
              ...(severity ? { severity } : {}),
              ...(status ? { status } : {}),
            })}
            className="min-h-10 rounded-md border border-border px-3 py-2 text-xs text-muted hover:text-foreground"
          >
            First page
          </Link>
          <Link
            href={pageUrl({
              cursor: page.nextCursor,
              ...(q ? { q } : {}),
              ...(severity ? { severity } : {}),
              ...(status ? { status } : {}),
            })}
            className="min-h-10 rounded-md border border-border px-3 py-2 text-xs text-muted hover:text-foreground"
          >
            Older issues
          </Link>
        </div>
      ) : null}
    </>
  );
}
