"use client";

import {
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  ExternalLink,
  FileText,
  FolderKanban,
  Languages,
  LoaderCircle,
  Mail,
  MoonStar,
  Newspaper,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { type RefObject, useEffect, useId, useMemo, useRef, useState } from "react";

import { isLikelyQuestion } from "@/features/search/lib/question-intent";
import { rankSearchItems } from "@/features/search/lib/rank";
import {
  type RankedSearchItem,
  type SearchGroup,
  type SearchIndexStatus,
  type SearchItem,
} from "@/features/search/types/search";
import { replaceLocale } from "@/i18n/client";
import { usePathname, useRouter } from "@/i18n/navigation";
import { type Locale } from "@/i18n/routing";
import { openBookingWidget } from "@/lib/booking";
import { reportClientError } from "@/lib/client-log";

const groupIcons = {
  action: MoonStar,
  assistant: Bot,
  blog: Newspaper,
  page: FileText,
  profile: UserRound,
  project: FolderKanban,
  work: BriefcaseBusiness,
} as const;

const PALETTE_OPEN_DURATION = 320;
const PALETTE_CLOSE_DURATION = 200;

function animationTransform(trigger: DOMRect | undefined, panel: DOMRect) {
  if (!trigger) return "translate3d(0, -12px, 0) scale(0.96)";

  const scaleX = Math.max(0.04, Math.min(1, trigger.width / panel.width));
  const scaleY = Math.max(0.04, Math.min(1, trigger.height / panel.height));
  const translateX = trigger.left - panel.left;
  const translateY = trigger.top - panel.top;

  return `translate3d(${translateX}px, ${translateY}px, 0) scale(${scaleX}, ${scaleY})`;
}

function cancelAnimation(animation: Animation | null) {
  if (!animation) return;
  animation.cancel();
}

type CommandPaletteProps = {
  indexError: string;
  indexStatus: SearchIndexStatus;
  items: SearchItem[];
  onOpenChange: (open: boolean) => void;
  onRetry: () => void;
  open: boolean;
  triggerRef: RefObject<HTMLButtonElement | null>;
};

function defaultItems(items: SearchItem[]) {
  return items
    .filter(
      (item) =>
        item.id === "page:projects" ||
        item.id === "page:blogs" ||
        item.id === "page:assistant" ||
        item.id === "profile:resume" ||
        item.id === "action:theme" ||
        item.id === "action:book",
    )
    .map((item) => ({ ...item, score: 1 }));
}

export function CommandPalette({
  indexError,
  indexStatus,
  items,
  onOpenChange,
  onRetry,
  open,
  triggerRef,
}: CommandPaletteProps) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations("Common.search");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef(new Map<string, HTMLButtonElement>());
  const panelAnimationRef = useRef<Animation>(null);
  const contentAnimationRef = useRef<Animation>(null);
  const animationRunRef = useRef(0);
  const openRef = useRef(open);
  openRef.current = open;
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const ranked = useMemo(
    () => (query.trim() ? rankSearchItems(items, query) : defaultItems(items)),
    [items, query],
  );
  const askItem = useMemo<RankedSearchItem | undefined>(() => {
    if (!isLikelyQuestion(query, ranked[0]?.score)) return undefined;
    return {
      aliases: [],
      description: t("ask.description"),
      group: "assistant",
      href: `/ask?q=${encodeURIComponent(query.trim())}`,
      id: "assistant:question",
      keywords: [],
      score: 1,
      title: t("ask.title", { query: query.trim() }),
    };
  }, [query, ranked, t]);
  const results = useMemo(() => (askItem ? [askItem, ...ranked] : ranked), [askItem, ranked]);
  const visibleGroupOrder = useMemo(
    () => [...new Set(results.map((item) => item.group))],
    [results],
  );
  const orderedResults = useMemo(
    () => visibleGroupOrder.flatMap((group) => results.filter((item) => item.group === group)),
    [results, visibleGroupOrder],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = orderedResults[activeIndex];

  useEffect(() => {
    const dialog = dialogRef.current;
    const panel = panelRef.current;
    const content = contentRef.current;
    if (!dialog || !panel || !content) return;

    const animationRun = ++animationRunRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wasClosed = !dialog.open;

    if (open && wasClosed) dialog.showModal();
    if (!open && wasClosed) return;

    const computedPanel = window.getComputedStyle(panel);
    const computedContent = window.getComputedStyle(content);
    const currentTransform = computedPanel.transform;
    const currentPanelOpacity = computedPanel.opacity;
    const currentContentOpacity = computedContent.opacity;

    cancelAnimation(panelAnimationRef.current);
    cancelAnimation(contentAnimationRef.current);
    panelAnimationRef.current = null;
    contentAnimationRef.current = null;

    panel.style.transform = "none";
    panel.style.opacity = "1";
    content.style.opacity = "1";

    const origin = animationTransform(
      triggerRef.current?.getBoundingClientRect(),
      panel.getBoundingClientRect(),
    );

    if (open) {
      dialog.dataset.state = "opening";
      panel.style.transform = wasClosed ? origin : currentTransform;
      panel.style.opacity = wasClosed ? "0.72" : currentPanelOpacity;
      content.style.opacity = wasClosed ? "0" : currentContentOpacity;

      if (reducedMotion) {
        panel.style.transform = "none";
        panel.style.opacity = "1";
        content.style.opacity = "1";
        dialog.dataset.state = "open";
        inputRef.current?.focus();
        return;
      }

      panel.style.willChange = "transform, opacity";
      window.requestAnimationFrame(() => {
        if (animationRun !== animationRunRef.current || !openRef.current) return;
        inputRef.current?.focus();

        const panelAnimation = panel.animate(
          [
            { opacity: panel.style.opacity, transform: panel.style.transform },
            { opacity: 1, transform: "none" },
          ],
          {
            duration: PALETTE_OPEN_DURATION,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            fill: "both",
          },
        );
        const contentAnimation = content.animate(
          [{ opacity: content.style.opacity }, { opacity: 1 }],
          {
            delay: 80,
            duration: 160,
            easing: "ease-out",
            fill: "both",
          },
        );
        panelAnimationRef.current = panelAnimation;
        contentAnimationRef.current = contentAnimation;

        panelAnimation.onfinish = () => {
          if (animationRun !== animationRunRef.current || !openRef.current) return;
          panel.style.transform = "none";
          panel.style.opacity = "1";
          panel.style.willChange = "";
          panelAnimation.cancel();
          panelAnimationRef.current = null;
          dialog.dataset.state = "open";
        };
        contentAnimation.onfinish = () => {
          if (animationRun !== animationRunRef.current || !openRef.current) return;
          content.style.opacity = "1";
          contentAnimation.cancel();
          contentAnimationRef.current = null;
        };
      });
      return;
    }

    dialog.dataset.state = "closing";
    panel.style.transform = currentTransform;
    panel.style.opacity = currentPanelOpacity;
    content.style.opacity = currentContentOpacity;

    if (reducedMotion) {
      dialog.close();
      panel.style.transform = "none";
      panel.style.opacity = "1";
      content.style.opacity = "1";
      dialog.dataset.state = "closed";
      return;
    }

    panel.style.willChange = "transform, opacity";
    const panelAnimation = panel.animate(
      [
        { opacity: currentPanelOpacity, transform: currentTransform },
        { opacity: 0.72, transform: origin },
      ],
      {
        duration: PALETTE_CLOSE_DURATION,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        fill: "both",
      },
    );
    const contentAnimation = content.animate([{ opacity: currentContentOpacity }, { opacity: 0 }], {
      duration: 100,
      easing: "ease-out",
      fill: "both",
    });
    panelAnimationRef.current = panelAnimation;
    contentAnimationRef.current = contentAnimation;

    panelAnimation.onfinish = () => {
      if (animationRun !== animationRunRef.current || openRef.current) return;
      panelAnimation.cancel();
      contentAnimation.cancel();
      panelAnimationRef.current = null;
      contentAnimationRef.current = null;
      panel.style.transform = "none";
      panel.style.opacity = "1";
      panel.style.willChange = "";
      content.style.opacity = "1";
      dialog.dataset.state = "closed";
      dialog.close();
    };
  }, [open, triggerRef]);

  useEffect(
    () => () => {
      animationRunRef.current += 1;
      cancelAnimation(panelAnimationRef.current);
      cancelAnimation(contentAnimationRef.current);
    },
    [],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!activeItem) return;
    optionRefs.current.get(activeItem.id)?.scrollIntoView({ block: "nearest" });
  }, [activeItem]);

  const close = () => {
    onOpenChange(false);
  };

  const execute = (item: SearchItem) => {
    close();

    if (item.action?.kind === "toggle-theme") {
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
      return;
    }
    if (item.action?.kind === "switch-locale") {
      if (item.action.locale !== locale) replaceLocale(pathname, item.action.locale);
      return;
    }
    if (item.action?.kind === "book-call") {
      window.setTimeout(() => {
        void openBookingWidget(triggerRef.current).catch((error: unknown) => {
          reportClientError("booking.openFromSearch", error);
        });
      });
      return;
    }
    if (!item.href) return;
    if (item.external) {
      window.open(item.href, "_blank", "noopener,noreferrer");
    } else if (item.machineRoute) {
      window.location.assign(item.href);
    } else {
      router.push(item.href);
    }
  };

  const grouped = visibleGroupOrder
    .map((group) => ({ group, items: orderedResults.filter((item) => item.group === group) }))
    .filter((entry) => entry.items.length > 0);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${listboxId}-title`}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={() => {
        onOpenChange(false);
        setQuery("");
        triggerRef.current?.focus();
      }}
      className="search-dialog"
    >
      <div
        ref={panelRef}
        className="search-dialog-panel max-h-[min(42rem,calc(100dvh-1rem))] w-[min(42rem,calc(100%-1rem))] overflow-hidden border border-border bg-background text-foreground shadow-2xl sm:max-h-[min(42rem,calc(100dvh-3rem))] sm:w-[min(42rem,calc(100%-3rem))]"
      >
        <div ref={contentRef} className="search-dialog-content">
          <h2 id={`${listboxId}-title`} className="sr-only">
            {t("dialogTitle")}
          </h2>
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search aria-hidden="true" className="shrink-0 text-muted" size={18} />
            <label htmlFor={`${listboxId}-input`} className="sr-only">
              {t("inputLabel")}
            </label>
            <input
              ref={inputRef}
              id={`${listboxId}-input`}
              role="combobox"
              aria-autocomplete="list"
              aria-busy={indexStatus === "loading"}
              aria-controls={indexStatus === "ready" ? listboxId : undefined}
              aria-expanded={indexStatus === "ready"}
              aria-activedescendant={activeItem ? `${listboxId}-${activeItem.id}` : undefined}
              autoComplete="off"
              spellCheck="false"
              value={query}
              placeholder={t("placeholder")}
              onChange={(event) => setQuery(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActiveIndex((current) =>
                    orderedResults.length ? (current + 1) % orderedResults.length : 0,
                  );
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActiveIndex((current) =>
                    orderedResults.length
                      ? (current - 1 + orderedResults.length) % orderedResults.length
                      : 0,
                  );
                } else if (event.key === "Enter" && activeItem) {
                  event.preventDefault();
                  execute(activeItem);
                }
              }}
              className="min-h-14 min-w-0 flex-1 bg-transparent py-3 text-base outline-none placeholder:text-muted"
            />
            <button
              type="button"
              onClick={close}
              aria-label={t("close")}
              className="inline-flex size-11 shrink-0 items-center justify-center text-muted hover:text-foreground"
            >
              <X aria-hidden="true" size={18} />
            </button>
          </div>

          <p aria-live="polite" className="sr-only">
            {indexStatus === "loading"
              ? t("loading")
              : indexStatus === "error"
                ? t("loadError")
                : t("resultCount", { count: orderedResults.length })}
          </p>
          {indexStatus === "loading" ? (
            <div className="flex min-h-40 flex-col items-center justify-center px-5 py-14 text-center">
              <LoaderCircle
                aria-hidden="true"
                className="size-5 animate-spin text-muted motion-reduce:animate-none"
              />
              <p className="mt-3 text-sm font-medium">{t("loading")}</p>
            </div>
          ) : indexStatus === "error" ? (
            <div className="flex min-h-40 flex-col items-center justify-center px-5 py-14 text-center">
              <p className="text-sm font-medium">{t("loadError")}</p>
              <p className="mt-2 text-xs text-muted">{indexError || t("loadErrorHint")}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 min-h-9 border border-border px-3 text-xs font-medium transition-colors duration-150 hover:bg-foreground/6 motion-reduce:transition-none"
              >
                {t("retry")}
              </button>
            </div>
          ) : orderedResults.length ? (
            <div
              id={listboxId}
              role="listbox"
              aria-label={t("resultsLabel")}
              className="max-h-[min(34rem,calc(100dvh-5.5rem))] overflow-y-auto p-2 sm:max-h-136"
            >
              {grouped.map(({ group, items: groupItems }) => (
                <SearchGroupResults
                  key={group}
                  activeId={activeItem?.id}
                  group={group}
                  items={groupItems}
                  listboxId={listboxId}
                  onExecute={execute}
                  onHover={(id) =>
                    setActiveIndex(orderedResults.findIndex((item) => item.id === id))
                  }
                  optionRefs={optionRefs}
                  title={t(`groups.${group}`)}
                />
              ))}
            </div>
          ) : (
            <div className="px-5 py-14 text-center">
              <p className="text-sm font-medium">{t("noResults")}</p>
              <p className="mt-2 text-xs text-muted">{t("noResultsHint")}</p>
            </div>
          )}
          {indexStatus === "ready" && orderedResults.length ? (
            <div className="hidden items-center justify-between border-t border-border px-4 py-2 font-mono text-[10px] text-muted sm:flex">
              <span>{t("keyboard.navigate")}</span>
              <span>{t("keyboard.select")}</span>
            </div>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        tabIndex={-1}
        aria-label={t("close")}
        onClick={close}
        className="search-dialog-dismiss-layer"
      />
    </dialog>
  );
}

function SearchGroupResults({
  activeId,
  group,
  items,
  listboxId,
  onExecute,
  onHover,
  optionRefs,
  title,
}: {
  activeId: string | undefined;
  group: SearchGroup;
  items: RankedSearchItem[];
  listboxId: string;
  onExecute: (item: SearchItem) => void;
  onHover: (id: string) => void;
  optionRefs: RefObject<Map<string, HTMLButtonElement>>;
  title: string;
}) {
  const headingId = `${listboxId}-${group}-heading`;
  const GroupIcon = groupIcons[group];
  return (
    <div role="group" aria-labelledby={headingId} className="not-last:mb-2">
      <div
        id={headingId}
        role="presentation"
        className="px-3 pt-3 pb-1 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-muted"
      >
        {title}
      </div>
      {items.map((item) => {
        const active = item.id === activeId;
        const ItemIcon =
          item.action?.kind === "book-call"
            ? CalendarDays
            : item.action?.kind === "switch-locale"
              ? Languages
              : item.id === "profile:email"
                ? Mail
                : GroupIcon;
        return (
          <button
            key={item.id}
            ref={(element) => {
              if (element) optionRefs.current?.set(item.id, element);
              else optionRefs.current?.delete(item.id);
            }}
            id={`${listboxId}-${item.id}`}
            type="button"
            role="option"
            tabIndex={-1}
            aria-selected={active}
            onClick={() => onExecute(item)}
            onMouseMove={() => onHover(item.id)}
            className="flex min-h-14 w-full items-center gap-3 rounded-sm px-3 py-2 text-left aria-selected:bg-foreground/6 hover:bg-foreground/6"
          >
            <ItemIcon aria-hidden="true" className="shrink-0 text-muted" size={17} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{item.title}</span>
              {item.description ? (
                <span className="mt-0.5 block truncate text-xs text-muted">{item.description}</span>
              ) : null}
            </span>
            {item.external ? (
              <ExternalLink aria-hidden="true" className="shrink-0 text-muted" size={14} />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
