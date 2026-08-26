"use client";

import { useEffect } from "react";

import { reportClientError } from "@/lib/client-log";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError("next.routeErrorBoundary", error, { digest: error.digest });
  }, [error]);

  return (
    <section aria-labelledby="error-heading" className="max-w-xl">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">Something went wrong</p>
      <h1 id="error-heading" className="mt-3 text-2xl font-medium tracking-tight">
        This page could not be loaded.
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        The issue may be temporary. Try loading the page again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 min-h-11 rounded-sm bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity duration-200 hover:opacity-80 motion-reduce:transition-none"
      >
        Try again
      </button>
    </section>
  );
}
