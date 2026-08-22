import type { Metadata } from "next";
import { PageHeader } from "@/components/portfolio/page-header";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { logoutAdmin } from "./actions";
import { GenerationForm } from "./generation-form";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Admin",
  description: "Private portfolio publishing controls.",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated();

  return (
    <>
      <PageHeader index="05" eyebrow="Admin" title="Manage blog publishing." />

      <section aria-labelledby="publishing-heading" className="mt-10">
        <h2
          id="publishing-heading"
          className="font-mono text-xs uppercase tracking-widest text-muted"
        >
          Blog publishing
        </h2>

        {authenticated ? (
          <div className="mt-3 divide-y divide-border border-y border-border">
            <div className="flex min-h-16 items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium">Access</p>
                <p className="mt-1 text-xs text-muted">Signed in on this browser</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">Active</span>
                <form action={logoutAdmin}>
                  <button
                    type="submit"
                    className="min-h-10 rounded-md border border-border px-3 text-xs text-muted transition-colors duration-150 hover:text-foreground motion-reduce:transition-none"
                  >
                    Sign out
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
          <LoginForm />
        )}
      </section>
    </>
  );
}
