import { getTranslations } from "next-intl/server";

import { resolveLocale, type LocaleParams } from "@/i18n/server";
import { createPortfolioOgImage, OG_IMAGE_SIZE } from "@/lib/og-image";

export const alt = "GitHub — Zomer Gregorio";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  const [t, github] = await Promise.all([
    getTranslations({ locale, namespace: "Metadata.og" }),
    getTranslations({ locale, namespace: "Github" }),
  ]);
  return createPortfolioOgImage({
    index: "04",
    eyebrow: github("eyebrow"),
    title: t("githubTitle"),
    description: t("githubDescription"),
  });
}
