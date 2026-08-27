"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const options = [
  { value: "system", label: "system", icon: Monitor },
  { value: "light", label: "light", icon: Sun },
  { value: "dark", label: "dark", icon: Moon },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("Common.theme");

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <fieldset className="m-0 flex items-center border border-border p-0.5">
      <legend className="sr-only">{t("legend")}</legend>
      {options.map(({ value, label, icon: Icon }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-label={t(label)}
            aria-pressed={active}
            className={cn(
              "cursor-pointer inline-flex size-7 items-center justify-center text-muted transition-colors duration-200 motion-reduce:transition-none",
              active ? "bg-foreground/5 text-foreground" : "hover:text-foreground",
            )}
          >
            <Icon aria-hidden="true" size={14} />
          </button>
        );
      })}
    </fieldset>
  );
}
