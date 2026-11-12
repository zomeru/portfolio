import "@tanstack/react-start/server-only";
import { getPublicProfile } from "@portfolio/api/public-portfolio";

import type { Locale } from "@/i18n/routing";
import { getTranslations } from "@/i18n/server";
import { createPortfolioOgImage } from "@/lib/og-image";

export async function image(locale: Locale) {
  const [profile, t] = await Promise.all([
    getPublicProfile(),
    getTranslations({ locale, namespace: "Metadata.og" }),
  ]);
  const name = profile?.name || "Zomer Gregorio";

  return createPortfolioOgImage(locale, {
    index: "01",
    eyebrow: t("portfolioEyebrow"),
    title: name,
    description: t("portfolioDescription"),
  });
}
