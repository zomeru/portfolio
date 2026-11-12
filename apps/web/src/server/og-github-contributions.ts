import "@tanstack/react-start/server-only";
import type { Locale } from "@/i18n/routing";
import { getTranslations } from "@/i18n/server";
import { createPortfolioOgImage } from "@/lib/og-image";

export async function image(locale: Locale) {
  const [t, github] = await Promise.all([
    getTranslations({ locale, namespace: "Metadata.og" }),
    getTranslations({ locale, namespace: "Github" }),
  ]);
  return createPortfolioOgImage(locale, {
    index: "04",
    eyebrow: github("eyebrow"),
    title: t("githubTitle"),
    description: t("githubDescription"),
  });
}
