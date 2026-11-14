import type { AdminErrorSeverity, AdminErrorStatus } from "@portfolio/api/types";
import { createFileRoute } from "@tanstack/react-router";

import { AdminAccessGate } from "@/components/admin/access-gate";
import { logoutAdminAccess } from "@/components/admin/actions";
import { ErrorFilters } from "@/components/admin/error/error-filters";
import { useAdminFormAction } from "@/components/admin/use-admin-action";
import { PageHeader } from "@/components/portfolio/page-header";
import { Link } from "@/i18n/navigation";
import { loadErrors, parseErrorSearch } from "@/lib/admin.functions";

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

export const Route = createFileRoute("/admin/error/")({
  validateSearch: (search: Record<string, unknown>) => parseErrorSearch(search),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => loadErrors({ data: deps }),
  staleTime: 0,
  head: () => ({
    meta: [
      { title: "Error monitoring | Admin" },
      { name: "description", content: "Private application error monitoring." },
    ],
  }),
  component: AdminErrorPage,
});

function AdminErrorPage() {
  const data = Route.useLoaderData();
  const lockAdmin = useAdminFormAction(logoutAdminAccess);
  if (!data.hasAccess) {
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

  const { status, severity, q, page } = data;

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
        <form action={lockAdmin}>
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
