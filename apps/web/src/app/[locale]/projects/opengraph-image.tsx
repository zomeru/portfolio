import { getTranslations } from "next-intl/server";

import { resolveLocale, type LocaleParams } from "@/i18n/server";
import { createPortfolioOgImage, OG_IMAGE_SIZE } from "@/lib/og-image";

export const alt = "Zomer Gregorio";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  const [t, projects] = await Promise.all([
    getTranslations({ locale, namespace: "Metadata.og" }),
    getTranslations({ locale, namespace: "Projects" }),
  ]);
  return createPortfolioOgImage({
    index: "02",
    eyebrow: projects("eyebrow"),
    title: t("projectsTitle"),
    description: t("projectsDescription"),
  });
}
