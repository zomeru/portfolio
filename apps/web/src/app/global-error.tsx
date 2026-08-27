"use client";

import { useEffect, useState } from "react";

import { isLocale, type Locale } from "@/i18n/routing";
import { reportClientError } from "@/lib/client-log";

import deErrors from "../../messages/de/errors.json";
import enErrors from "../../messages/en/errors.json";
import jaErrors from "../../messages/ja/errors.json";
import zhCnErrors from "../../messages/zh-CN/errors.json";

import "./globals.css";

const messages = {
  de: deErrors.global,
  en: enErrors.global,
  ja: jaErrors.global,
  "zh-CN": zhCnErrors.global,
} satisfies Record<Locale, typeof enErrors.global>;

function detectLocale(): Locale {
  const pathLocale = window.location.pathname.split("/")[1];
  if (pathLocale && isLocale(pathLocale)) return pathLocale;

  const cookieLocale = document.cookie
    .split(";")
    .map((cookie) => cookie.trim().split("=", 2))
    .find(([name]) => name === "PORTFOLIO_LOCALE")?.[1];
  if (cookieLocale && isLocale(cookieLocale)) return cookieLocale;

  const language = navigator.language.toLowerCase();
  if (language.startsWith("ja")) return "ja";
  if (language.startsWith("zh")) return "zh-CN";
  if (language.startsWith("de")) return "de";
  return "en";
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [locale, setLocale] = useState<Locale>("en");
  const message = messages[locale];

  useEffect(() => {
    reportClientError("next.globalErrorBoundary", error, { digest: error.digest });
  }, [error]);

  useEffect(() => {
    const detectedLocale = detectLocale();
    document.documentElement.lang = detectedLocale;
    setLocale(detectedLocale);
  }, []);

  return (
    <html lang={locale}>
      <body>
        <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-5 py-12 sm:px-8">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            {message.eyebrow}
          </p>
          <h1 className="mt-3 text-2xl font-medium tracking-tight">{message.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">{message.description}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 min-h-11 self-start rounded-sm bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity duration-200 hover:opacity-80 motion-reduce:transition-none"
          >
            {message.action}
          </button>
        </main>
      </body>
    </html>
  );
}
