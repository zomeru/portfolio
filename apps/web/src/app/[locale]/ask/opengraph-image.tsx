import { getTranslations } from "next-intl/server";

import { resolveLocale, type LocaleParams } from "@/i18n/server";
import { createPortfolioOgImage, OG_IMAGE_SIZE } from "@/lib/og-image";

export const alt = "Zomer AI";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  const [t, assistant] = await Promise.all([
    getTranslations({ locale, namespace: "Metadata.og" }),
    getTranslations({ locale, namespace: "Assistant" }),
  ]);
  return createPortfolioOgImage({
    index: "05",
    eyebrow: assistant("eyebrow"),
    title: t("assistantTitle"),
    description: t("assistantDescription"),
  });
}
