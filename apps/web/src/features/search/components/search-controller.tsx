"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import type { SearchIndexStatus, SearchItem } from "@/features/search/types/search";
import { reportClientError } from "@/lib/client-log";
import { classifyRequestFailure, HttpRequestError } from "@/lib/request-failure";
import { cn } from "@/lib/utils";

const CommandPalette = dynamic(
  () => import("./command-palette").then((module) => module.CommandPalette),
  { ssr: false },
);

export function SearchController({
  endpoint,
  compact = false,
}: {
  endpoint: string;
  compact?: boolean;
}) {
  const t = useTranslations("Common.search");
  const tRequest = useTranslations("Errors.request");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [indexRequest, setIndexRequest] = useState(0);
  const [indexStatus, setIndexStatus] = useState<SearchIndexStatus>("loading");
  const [indexError, setIndexError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [shortcut, setShortcut] = useState("⌘K");
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!loaded) return;
    const controller = new AbortController();
    setItems([]);
    setIndexStatus("loading");
    setIndexError("");

    void fetch(endpoint, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new HttpRequestError(response.status);
        const payload: unknown = await response.json();
        if (!Array.isArray(payload)) throw new Error("Search index response is invalid.");
        setItems(payload as SearchItem[]);
        setIndexStatus("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setIndexStatus("error");
        setIndexError(tRequest(classifyRequestFailure(error)));
        reportClientError("search.loadIndex", error);
      });

    return () => controller.abort();
  }, [endpoint, indexRequest, loaded, tRequest]);

  useEffect(() => {
    setShortcut(/Mac|iPhone|iPad|iPod/i.test(navigator.platform) ? "⌘K" : "Ctrl K");
    const handleShortcut = (event: KeyboardEvent) => {
      if (
        event.key.toLocaleLowerCase() !== "k" ||
        (!event.metaKey && !event.ctrlKey) ||
        event.altKey ||
        event.shiftKey
      ) {
        return;
      }
      if (!triggerRef.current?.getClientRects().length) return;
      event.preventDefault();
      setLoaded(true);
      setOpen((current) => !current);
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-keyshortcuts="Meta+K Control+K"
        onClick={() => {
          setLoaded(true);
          setOpen((current) => !current);
        }}
        className={cn(
          "search-trigger inline-flex items-center justify-between border border-border px-2 text-xs text-muted transition-colors duration-150 hover:text-foreground motion-reduce:transition-none",
          compact ? "h-8 w-18 gap-2" : "min-h-8 min-w-28 gap-2",
        )}
      >
        <span className="inline-flex items-center gap-2">
          <Search aria-hidden="true" size={14} strokeWidth={1.75} />
          <span className={compact ? "sr-only" : undefined}>{t("trigger")}</span>
        </span>
        <kbd className="rounded-sm border border-foreground/20 bg-foreground/5 px-1.5 py-0.5 font-mono text-[10px] font-medium leading-none text-foreground shadow-[inset_0_-1px_0_rgb(0_0_0/0.12)] dark:shadow-[inset_0_-1px_0_rgb(255_255_255/0.12)]">
          {shortcut}
        </kbd>
      </button>
      {loaded ? (
        <CommandPalette
          indexStatus={indexStatus}
          indexError={indexError}
          items={items}
          open={open}
          onOpenChange={setOpen}
          onRetry={() => {
            setIndexStatus("loading");
            setIndexError("");
            setIndexRequest((current) => current + 1);
          }}
          triggerRef={triggerRef}
        />
      ) : null}
    </>
  );
}
