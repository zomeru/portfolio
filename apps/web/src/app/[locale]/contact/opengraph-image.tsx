import { getTranslations } from "next-intl/server";

import { resolveLocale, type LocaleParams } from "@/i18n/server";
import { createPortfolioOgImage, OG_IMAGE_SIZE } from "@/lib/og-image";

export const alt = "Zomer Gregorio";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  const [t, contact] = await Promise.all([
    getTranslations({ locale, namespace: "Metadata.og" }),
    getTranslations({ locale, namespace: "Contact" }),
  ]);
  return createPortfolioOgImage({
    index: "06",
    eyebrow: contact("eyebrow"),
    title: t("contactTitle"),
    description: t("contactDescription"),
  });
}
