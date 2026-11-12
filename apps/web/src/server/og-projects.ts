import "@tanstack/react-start/server-only";
import type { Locale } from "@/i18n/routing";
import { getTranslations } from "@/i18n/server";
import { createPortfolioOgImage } from "@/lib/og-image";

export async function image(locale: Locale) {
  const [t, projects] = await Promise.all([
    getTranslations({ locale, namespace: "Metadata.og" }),
    getTranslations({ locale, namespace: "Projects" }),
  ]);
  return createPortfolioOgImage(locale, {
    index: "02",
    eyebrow: projects("eyebrow"),
    title: t("projectsTitle"),
    description: t("projectsDescription"),
  });
}
