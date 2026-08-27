"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { reportClientError } from "@/lib/client-log";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Errors.route");
  useEffect(() => {
    reportClientError("next.routeErrorBoundary", error, { digest: error.digest });
  }, [error]);

  return (
    <section aria-labelledby="error-heading" className="max-w-xl">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">{t("eyebrow")}</p>
      <h1 id="error-heading" className="mt-3 text-2xl font-medium tracking-tight">
        {t("title")}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">{t("description")}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 min-h-11 rounded-sm bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity duration-200 hover:opacity-80 motion-reduce:transition-none"
      >
        {t("action")}
      </button>
    </section>
  );
}
