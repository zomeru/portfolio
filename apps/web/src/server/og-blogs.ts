import "@tanstack/react-start/server-only";
import type { Locale } from "@/i18n/routing";
import { getTranslations } from "@/i18n/server";
import { createPortfolioOgImage } from "@/lib/og-image";

export async function image(locale: Locale) {
  const [t, blogs] = await Promise.all([
    getTranslations({ locale, namespace: "Metadata.og" }),
    getTranslations({ locale, namespace: "Blogs" }),
  ]);
  return createPortfolioOgImage(locale, {
    index: "03",
    eyebrow: blogs("eyebrow"),
    title: t("blogsTitle"),
    description: t("blogsDescription"),
  });
}
