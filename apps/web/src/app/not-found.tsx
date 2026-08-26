import type { Metadata } from "next";
import Link from "next/link";

import { PageTransition } from "@/components/layout/page-transition";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <PageTransition>
      <section aria-labelledby="not-found-heading" className="max-w-xl">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">404 / Not found</p>
        <h1 id="not-found-heading" className="mt-3 text-2xl font-medium tracking-tight">
          This page does not exist.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The address may be outdated, or the page may have moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center rounded-sm bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity duration-200 hover:opacity-80 motion-reduce:transition-none"
        >
          Back to portfolio
        </Link>
      </section>
    </PageTransition>
  );
}
