import "@tanstack/react-start/server-only";
import type { Locale } from "@/i18n/routing";
import { getTranslations } from "@/i18n/server";
import { createPortfolioOgImage } from "@/lib/og-image";

export async function image(locale: Locale) {
  const [t, assistant] = await Promise.all([
    getTranslations({ locale, namespace: "Metadata.og" }),
    getTranslations({ locale, namespace: "Assistant" }),
  ]);
  return createPortfolioOgImage(locale, {
    index: "05",
    eyebrow: assistant("eyebrow"),
    title: t("assistantTitle"),
    description: t("assistantDescription"),
  });
}
