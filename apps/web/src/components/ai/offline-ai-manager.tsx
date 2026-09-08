"use client";

import { Check, Download, HardDrive, LoaderCircle, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { useNetworkStatus } from "@/components/pwa/network-status";
import type { SearchItem } from "@/features/search/types/search";
import { reportClientWarning } from "@/lib/client-log";
import {
  getOfflineKnowledge,
  getOfflineModelState,
  setOfflineModelState,
  storeOfflineKnowledge,
} from "@/lib/offline/chat-database";
import {
  getOfflineAiCompatibility,
  getOfflineModelStorage,
  installOfflineModel,
  OFFLINE_MODEL_DOWNLOAD_MB,
  OFFLINE_MODEL_ID,
  OFFLINE_MODEL_LABEL,
  removeOfflineModel,
} from "@/lib/offline/offline-ai";

type ManagerState =
  | "checking"
  | "confirm"
  | "downloading"
  | "error"
  | "idle"
  | "installed"
  | "removing";

const KNOWLEDGE_MAX_AGE_MS = 24 * 60 * 60 * 1_000;
const SEARCH_GROUPS = new Set([
  "action",
  "assistant",
  "blog",
  "page",
  "profile",
  "project",
  "work",
]);
const OFFLINE_KNOWLEDGE_GROUPS = new Set(["blog", "page", "profile", "project", "work"]);

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isSearchItem(value: unknown): value is SearchItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<SearchItem>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.group === "string" &&
    SEARCH_GROUPS.has(item.group) &&
    isStringArray(item.aliases) &&
    isStringArray(item.keywords) &&
    (item.description === undefined || typeof item.description === "string") &&
    (item.href === undefined || typeof item.href === "string") &&
    (item.external === undefined || typeof item.external === "boolean") &&
    (item.machineRoute === undefined || typeof item.machineRoute === "boolean")
  );
}

async function downloadOfflineKnowledge(locale: string) {
  const response = await fetch(`/${locale}/search-index.json`, {
    cache: "no-cache",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Offline portfolio knowledge could not be downloaded.");
  const payload: unknown = await response.json();
  if (!Array.isArray(payload) || !payload.every(isSearchItem)) {
    throw new Error("Offline portfolio knowledge is invalid.");
  }
  const items = payload.filter(
    (item) =>
      OFFLINE_KNOWLEDGE_GROUPS.has(item.group) &&
      Boolean(item.href) &&
      !item.external &&
      !item.machineRoute,
  );
  if (items.length === 0) throw new Error("Offline portfolio knowledge is empty.");
  await storeOfflineKnowledge(locale, items);
}

function formatBytes(bytes: number) {
  if (bytes <= 0) return "0 MB";
  if (bytes >= 1_024 * 1_024 * 1_024) return `${(bytes / (1_024 * 1_024 * 1_024)).toFixed(1)} GB`;
  return `${Math.round(bytes / (1_024 * 1_024))} MB`;
}

export function OfflineAiManager({
  installed,
  onInstalledChange,
}: {
  installed: boolean;
  onInstalledChange: (installed: boolean) => void;
}) {
  const locale = useLocale();
  const t = useTranslations("Assistant.offlineModel");
  const { isOffline } = useNetworkStatus();
  const [state, setState] = useState<ManagerState>("checking");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [availableStorage, setAvailableStorage] = useState<number>();
  const refreshedLocalesRef = useRef(new Set<string>());
  const compatibility = getOfflineAiCompatibility();

  useEffect(() => {
    let active = true;
    void Promise.all([getOfflineModelState(), getOfflineModelStorage().catch(() => undefined)])
      .then(([modelState, storage]) => {
        if (!active) return;
        const installed = modelState?.modelId === OFFLINE_MODEL_ID;
        setState(installed ? "installed" : "idle");
        setAvailableStorage(storage?.available);
        onInstalledChange(installed);
      })
      .catch((error: unknown) => {
        reportClientWarning("assistant.offlineModelState", error);
        if (active) setState("error");
      });
    return () => {
      active = false;
    };
  }, [onInstalledChange]);

  useEffect(() => {
    if (!installed && state === "installed") {
      setState("idle");
      setMessage("");
    }
  }, [installed, state]);

  useEffect(() => {
    if (state !== "installed" || isOffline || refreshedLocalesRef.current.has(locale)) return;
    refreshedLocalesRef.current.add(locale);
    void getOfflineKnowledge(locale)
      .then((knowledge) => {
        if (!knowledge || Date.now() - knowledge.updatedAt > KNOWLEDGE_MAX_AGE_MS) {
          return downloadOfflineKnowledge(locale);
        }
      })
      .catch((error: unknown) => {
        reportClientWarning("assistant.refreshOfflineKnowledge", error, { locale });
      });
  }, [isOffline, locale, state]);

  async function install() {
    if (isOffline) {
      setState("error");
      setMessage(t("requiresConnection"));
      return;
    }
    setState("downloading");
    setMessage(t("preparingKnowledge"));
    setProgress(0);
    try {
      await downloadOfflineKnowledge(locale);
      await installOfflineModel((report) => {
        setProgress(Math.max(0, Math.min(1, report.progress)));
        setMessage(report.text || t("downloading"));
      });
      await setOfflineModelState({
        installedAt: new Date().toISOString(),
        modelId: OFFLINE_MODEL_ID,
      });
      const storage = await getOfflineModelStorage().catch(() => undefined);
      setAvailableStorage(storage?.available);
      setState("installed");
      setMessage(t("installed"));
      onInstalledChange(true);
    } catch (error) {
      reportClientWarning("assistant.installOfflineModel", error);
      setState("error");
      setMessage(
        error instanceof Error && /enough available browser storage/u.test(error.message)
          ? t("insufficientStorage")
          : t("installFailed"),
      );
      onInstalledChange(false);
    }
  }

  async function remove() {
    setState("removing");
    setMessage(t("removing"));
    try {
      await removeOfflineModel();
      await setOfflineModelState(undefined);
      setState("idle");
      setMessage(t("removed"));
      setProgress(0);
      onInstalledChange(false);
    } catch (error) {
      reportClientWarning("assistant.removeOfflineModel", error);
      setState("error");
      setMessage(t("removeFailed"));
    }
  }

  const unsupportedReason = compatibility.supported
    ? undefined
    : t(`unsupported.${compatibility.reason}`);
  return (
    <details className="border-b border-border py-3 text-xs text-muted">
      <summary className="w-fit cursor-pointer rounded-sm py-1 font-medium text-foreground hover:text-muted">
        {t("title")}
      </summary>
      <div className="mt-3 max-w-2xl space-y-3">
        <p className="leading-relaxed">
          {unsupportedReason ?? t("description", { size: OFFLINE_MODEL_DOWNLOAD_MB })}
        </p>
        <p className="inline-flex items-center gap-2 font-mono">
          <HardDrive aria-hidden="true" size={14} />
          {OFFLINE_MODEL_LABEL}
          {availableStorage === undefined
            ? ""
            : ` · ${t("available", { size: formatBytes(availableStorage) })}`}
        </p>

        {state === "confirm" ? (
          <div className="rounded-md border border-border p-3">
            <p className="leading-relaxed">{t("confirm", { size: OFFLINE_MODEL_DOWNLOAD_MB })}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void install()}
                className="min-h-10 rounded-md bg-foreground px-3 text-background"
              >
                {t("download")}
              </button>
              <button
                type="button"
                onClick={() => setState("idle")}
                className="min-h-10 rounded-md border border-border px-3 text-foreground"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        ) : null}

        {state === "downloading" ? (
          <div role="status" aria-live="polite">
            <div className="h-1.5 overflow-hidden rounded-full bg-border" aria-hidden="true">
              <div
                className="h-full bg-foreground transition-[width] motion-reduce:transition-none"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <p className="mt-2 inline-flex items-center gap-2">
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin motion-reduce:animate-none"
                size={14}
              />
              {message} {Math.round(progress * 100)}%
            </p>
          </div>
        ) : null}

        {state === "installed" ? (
          <div className="flex flex-wrap items-center gap-3">
            <p role="status" className="inline-flex items-center gap-2 text-foreground">
              <Check aria-hidden="true" size={14} /> {message || t("installed")}
            </p>
            <button
              type="button"
              onClick={() => void remove()}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-3 text-foreground hover:border-foreground"
            >
              <Trash2 aria-hidden="true" size={14} /> {t("remove")}
            </button>
          </div>
        ) : null}

        {state === "idle" && !unsupportedReason ? (
          <button
            type="button"
            disabled={isOffline}
            onClick={() => setState("confirm")}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-3 text-foreground hover:border-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download aria-hidden="true" size={14} /> {t("enable")}
          </button>
        ) : null}

        {state === "removing" ? <p role="status">{message}</p> : null}
        {state === "error" ? (
          <div className="space-y-3">
            <p role="alert" className="text-red-600 dark:text-red-400">
              {message || t("stateFailed")}
            </p>
            {!unsupportedReason ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isOffline}
                  onClick={() => setState("confirm")}
                  className="min-h-10 rounded-md border border-border px-3 text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("enable")}
                </button>
                <button
                  type="button"
                  onClick={() => void remove()}
                  className="min-h-10 rounded-md border border-border px-3 text-foreground"
                >
                  {t("remove")}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </details>
  );
}
