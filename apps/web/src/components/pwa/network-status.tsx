"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export const NETWORK_AVAILABLE_EVENT = "portfolio:network-available";

type NetworkStatusContextValue = {
  isOffline: boolean;
  verifyConnection: () => Promise<boolean>;
};

const NetworkStatusContext = createContext<NetworkStatusContextValue | null>(null);

export function useNetworkStatus() {
  const value = useContext(NetworkStatusContext);
  if (!value) throw new Error("useNetworkStatus must be used inside NetworkStatusProvider.");
  return value;
}

function NetworkStatusBanner({
  actionBlocked,
  isOffline,
}: {
  actionBlocked: boolean;
  isOffline: boolean;
}) {
  const t = useTranslations("Common.network");
  const tRequest = useTranslations("Errors.request");
  const mounted = useRef(false);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (isOffline) {
      setShowRestored(false);
      return;
    }
    setShowRestored(true);
    const timeout = window.setTimeout(() => setShowRestored(false), 4_000);
    return () => window.clearTimeout(timeout);
  }, [isOffline]);

  if (!isOffline && !showRestored) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
    >
      <p className="max-w-lg rounded-full border border-border bg-background/95 px-4 py-2 text-center text-xs text-muted shadow-lg backdrop-blur">
        {actionBlocked ? tRequest("offline") : isOffline ? t("offline") : t("restored")}
      </p>
    </div>
  );
}

export function NetworkStatusProvider({
  blockNetworkFormsWhenOffline = false,
  children,
}: {
  blockNetworkFormsWhenOffline?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [actionBlocked, setActionBlocked] = useState(false);
  const [serverReachable, setServerReachable] = useState(true);
  const previousOffline = useRef(false);
  const probeRef = useRef<Promise<boolean> | null>(null);
  const isOffline = !serverReachable;

  const verifyConnection = useCallback(() => {
    if (probeRef.current) return probeRef.current;
    if (navigator.onLine === false) {
      setServerReachable(false);
      return Promise.resolve(false);
    }

    const probe = (async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 5_000);
      try {
        const response = await fetch(`/api/?probe=${Date.now()}`, {
          cache: "no-store",
          credentials: "same-origin",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        const reachable = response.ok;
        setServerReachable(reachable);
        return reachable;
      } catch {
        setServerReachable(false);
        return false;
      } finally {
        window.clearTimeout(timeout);
        probeRef.current = null;
      }
    })();
    probeRef.current = probe;
    return probe;
  }, []);

  useEffect(() => {
    const markOffline = () => setServerReachable(false);
    const checkOnline = () => void verifyConnection();
    const checkWhenVisible = () => {
      if (document.visibilityState !== "visible") return;
      void verifyConnection().then((reachable) => {
        if (reachable) window.dispatchEvent(new Event(NETWORK_AVAILABLE_EVENT));
      });
    };
    window.addEventListener("offline", markOffline);
    window.addEventListener("online", checkOnline);
    document.addEventListener("visibilitychange", checkWhenVisible);
    void verifyConnection();
    return () => {
      window.removeEventListener("offline", markOffline);
      window.removeEventListener("online", checkOnline);
      document.removeEventListener("visibilitychange", checkWhenVisible);
    };
  }, [verifyConnection]);

  useEffect(() => {
    if (isOffline) {
      previousOffline.current = true;
      const interval = window.setInterval(() => void verifyConnection(), 30_000);
      return () => window.clearInterval(interval);
    }
    if (!previousOffline.current) return;
    previousOffline.current = false;
    window.dispatchEvent(new Event(NETWORK_AVAILABLE_EVENT));
    router.refresh();
  }, [isOffline, router, verifyConnection]);

  useEffect(() => {
    if (!blockNetworkFormsWhenOffline) return;
    const blockOfflineSubmission = (event: SubmitEvent) => {
      if (!isOffline) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setActionBlocked(true);
    };
    document.addEventListener("submit", blockOfflineSubmission, true);
    return () => document.removeEventListener("submit", blockOfflineSubmission, true);
  }, [blockNetworkFormsWhenOffline, isOffline]);

  useEffect(() => {
    if (!isOffline) setActionBlocked(false);
  }, [isOffline]);

  const value = useMemo(() => ({ isOffline, verifyConnection }), [isOffline, verifyConnection]);
  return (
    <NetworkStatusContext.Provider value={value}>
      {children}
      <NetworkStatusBanner actionBlocked={actionBlocked} isOffline={isOffline} />
    </NetworkStatusContext.Provider>
  );
}
