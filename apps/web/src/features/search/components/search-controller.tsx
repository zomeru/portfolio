"use client";

import { Search, X } from "lucide";
import { MorphIcon } from "morphicons/react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import type { SearchItem } from "@/features/search/types/search";
import { reportClientError } from "@/lib/client-log";

const CommandPalette = dynamic(
  () => import("./command-palette").then((module) => module.CommandPalette),
  { ssr: false },
);

export function SearchController({ endpoint }: { endpoint: string }) {
  const t = useTranslations("Common.search");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [shortcut, setShortcut] = useState("⌘K");
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!loaded) return;
    const controller = new AbortController();

    void fetch(endpoint, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Search index request failed with ${response.status}.`);
        const payload: unknown = await response.json();
        if (!Array.isArray(payload)) throw new Error("Search index response is invalid.");
        setItems(payload as SearchItem[]);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        reportClientError("search.loadIndex", error);
      });

    return () => controller.abort();
  }, [endpoint, loaded]);

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
        className="search-trigger inline-flex min-h-11 min-w-11 items-center justify-center gap-2 border border-border px-2 text-xs text-muted transition-colors duration-150 hover:text-foreground motion-reduce:transition-none sm:min-h-8 sm:min-w-28 sm:justify-between"
      >
        <span className="inline-flex items-center gap-2">
          <MorphIcon
            aria-hidden="true"
            icon={open ? X : Search}
            reducedMotion="user"
            spring="snappy"
            size={14}
            strokeWidth={1.75}
          />
          <span className="hidden sm:inline">{t("trigger")}</span>
        </span>
        <kbd className="hidden font-mono text-[10px] text-muted sm:inline">{shortcut}</kbd>
        <span className="sr-only sm:hidden">{t("trigger")}</span>
      </button>
      {loaded ? (
        <CommandPalette items={items} open={open} onOpenChange={setOpen} triggerRef={triggerRef} />
      ) : null}
    </>
  );
}
