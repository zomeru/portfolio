import { getPublicBlogPost } from "@portfolio/api/public-portfolio";
import { getTranslations } from "next-intl/server";

import { resolveLocale } from "@/i18n/server";
import { createPortfolioOgImage, OG_IMAGE_SIZE } from "@/lib/og-image";

export const alt = "Zomer Gregorio";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const locale = await resolveLocale(params);
  const [{ slug }, postTranslations] = await Promise.all([
    params,
    getTranslations({ locale, namespace: "Metadata.og" }),
  ]);
  const post = await getPublicBlogPost(slug);

  return createPortfolioOgImage({
    index: "03",
    eyebrow: postTranslations("blogArticle"),
    title: post?.title ?? postTranslations("blogFallbackTitle"),
    description: post?.description ?? postTranslations("blogFallbackDescription"),
    ...(post?.date
      ? {
          footer: new Intl.DateTimeFormat(locale, {
            dateStyle: "long",
            timeZone: "UTC",
          }).format(new Date(post.date)),
        }
      : {}),
  });
}
