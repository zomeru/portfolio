import "@tanstack/react-start/server-only";
import type { Locale } from "@/i18n/routing";
import { getTranslations } from "@/i18n/server";
import { createPortfolioOgImage } from "@/lib/og-image";

export async function image(locale: Locale) {
  const [t, contact] = await Promise.all([
    getTranslations({ locale, namespace: "Metadata.og" }),
    getTranslations({ locale, namespace: "Contact" }),
  ]);
  return createPortfolioOgImage(locale, {
    index: "06",
    eyebrow: contact("eyebrow"),
    title: t("contactTitle"),
    description: t("contactDescription"),
  });
}
