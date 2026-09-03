"use client";

import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { reportClientWarning } from "@/lib/client-log";

export function ServiceWorkerRegistration() {
  const pathname = usePathname();
  const locale = useLocale();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let active = true;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((registration) => {
        if (!active) return;
        void registration.update().catch((error: unknown) => {
          reportClientWarning("pwa.updateServiceWorker", error);
        });
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              worker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      })
      .catch((error: unknown) => {
        reportClientWarning("pwa.registerServiceWorker", error);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.ready
      .then((registration) => {
        registration.active?.postMessage({
          type: "CACHE_ROUTE",
          url: new URL(pathname, window.location.origin).href,
        });
      })
      .catch((error: unknown) => {
        reportClientWarning("pwa.cacheRoute", error, { pathname });
      });
  }, [pathname]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.ready
      .then((registration) => {
        registration.active?.postMessage({
          type: "CACHE_ROUTE_IF_MISSING",
          url: new URL(`/${locale}`, window.location.origin).href,
        });
      })
      .catch((error: unknown) => {
        reportClientWarning("pwa.cacheLocaleHome", error, { locale });
      });
  }, [locale]);

  return null;
}
