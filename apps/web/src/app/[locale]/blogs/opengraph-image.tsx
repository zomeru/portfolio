import { getTranslations } from "next-intl/server";

import { resolveLocale, type LocaleParams } from "@/i18n/server";
import { createPortfolioOgImage, OG_IMAGE_SIZE } from "@/lib/og-image";

export const alt = "Zomer Gregorio";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  const [t, blogs] = await Promise.all([
    getTranslations({ locale, namespace: "Metadata.og" }),
    getTranslations({ locale, namespace: "Blogs" }),
  ]);
  return createPortfolioOgImage({
    index: "03",
    eyebrow: blogs("eyebrow"),
    title: t("blogsTitle"),
    description: t("blogsDescription"),
  });
}
