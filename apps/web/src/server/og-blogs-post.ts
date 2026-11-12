import "@tanstack/react-start/server-only";
import { getPublicBlogPost } from "@portfolio/api/public-portfolio";

import type { Locale } from "@/i18n/routing";
import { getTranslations } from "@/i18n/server";
import { createPortfolioOgImage } from "@/lib/og-image";

export async function image(locale: Locale, slug: string) {
  const postTranslations = await getTranslations({ locale, namespace: "Metadata.og" });
  const post = await getPublicBlogPost(slug);

  return createPortfolioOgImage(locale, {
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
