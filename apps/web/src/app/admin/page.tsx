import { apiApp } from "@portfolio/api";
import type { Metadata } from "next";
import { PageHeader } from "@/components/portfolio/page-header";
import { getAdminSessionToken } from "@/lib/admin-session";
import { logoutAdmin } from "./actions";
import { GenerationForm } from "./generation-form";
import { KnowledgeIndexForm } from "./knowledge-index-form";
import { LoginForm } from "./login-form";

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

async function loadKnowledgeStatus(token: string) {
  try {
    const response = await apiApp.request("http://portfolio.internal/api/admin/ai/status", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    return (await response.json()) as KnowledgeIndexStatus;
  } catch {
    return null;
  }
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
  const [publishingToken, reindexToken] = await Promise.all([
    getAdminSessionToken("blog-generation"),
    getAdminSessionToken("ai-reindex"),
  ]);
  const status = reindexToken ? await loadKnowledgeStatus(reindexToken) : null;

  return (
    <>
      <PageHeader index="06" eyebrow="Admin" title="Manage portfolio automation." />

      <section aria-labelledby="publishing-heading" className="mt-10">
        <h2
          id="publishing-heading"
          className="font-mono text-xs uppercase tracking-widest text-muted"
        >
          Blog publishing
        </h2>

        {publishingToken ? (
          <div className="mt-3 divide-y divide-border border-y border-border">
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

      <section aria-labelledby="knowledge-heading" className="mt-16">
        <h2
          id="knowledge-heading"
          className="font-mono text-xs uppercase tracking-widest text-muted"
        >
          AI knowledge index
        </h2>
        {reindexToken ? (
          <div className="mt-3 divide-y divide-border border-y border-border">
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
