"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-5 py-12 sm:px-8">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            Something went wrong
          </p>
          <h1 className="mt-3 text-2xl font-medium tracking-tight">
            The portfolio could not be loaded.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            The issue may be temporary. Try loading the site again.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 min-h-11 self-start rounded-sm bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity duration-200 hover:opacity-80 motion-reduce:transition-none"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
