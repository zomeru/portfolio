"use client";

import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { LanguagePicker } from "@/components/layout/language-picker";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SearchController } from "@/features/search/components/search-controller";
import { cn } from "@/lib/utils";

type MobileHeaderControlsProps = {
  children: ReactNode;
  hasTechStack: boolean;
  searchEndpoint?: string | undefined;
  showLanguagePicker?: boolean;
};

export function MobileHeaderControls({
  children,
  hasTechStack,
  searchEndpoint,
  showLanguagePicker = true,
}: MobileHeaderControlsProps) {
  const t = useTranslations("Common");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function closeFromOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeFromKeyboard(event: KeyboardEvent) {
      if (event.key !== "Escape" || document.querySelector(".search-dialog[open]")) return;
      setOpen(false);
      menuTriggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("keydown", closeFromKeyboard);
    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("keydown", closeFromKeyboard);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="absolute right-0 top-10 z-30 flex items-start gap-2 sm:top-12 md:contents"
    >
      <div className="flex items-center gap-2 md:hidden">
        {searchEndpoint ? <SearchController endpoint={searchEndpoint} compact /> : null}
        {showLanguagePicker ? <LanguagePicker /> : null}
        <button
          ref={menuTriggerRef}
          type="button"
          aria-controls="mobile-header-menu"
          aria-expanded={open}
          aria-label={open ? t("nav.close") : t("nav.menu")}
          onClick={() => setOpen((current) => !current)}
          className="inline-flex size-8 items-center justify-center border border-border text-muted transition-colors duration-150 hover:bg-foreground/5 hover:text-foreground motion-safe:active:scale-[0.96] motion-reduce:transition-none"
        >
          {open ? <X aria-hidden="true" size={15} /> : <Menu aria-hidden="true" size={15} />}
        </button>
      </div>
      <div
        id="mobile-header-menu"
        className={cn(
          open ? "block" : "hidden",
          "absolute right-0 top-full mt-2 w-[min(28rem,calc(100vw-2.5rem))] border border-border bg-background p-5 shadow-xl",
          hasTechStack
            ? "md:static md:mt-0 md:block md:w-auto md:border-0 md:bg-transparent md:p-0 md:shadow-none"
            : "md:hidden",
        )}
      >
        {hasTechStack ? (
          <div>
            <p className="mb-4 font-mono text-[10px] font-medium uppercase tracking-wider text-muted md:hidden">
              {t("techStack.trigger")}
            </p>
            {children}
          </div>
        ) : null}
        <div className={cn("flex md:hidden", hasTechStack && "mt-5 border-t border-border pt-4")}>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
