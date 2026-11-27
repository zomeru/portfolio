import "@tanstack/react-start/server-only";
import { getPublicBlogPost } from "@portfolio/api/public-portfolio";

import type { Locale } from "@/i18n/routing";

export async function image(locale: Locale, slug: string) {
  const post = await getPublicBlogPost(slug);
  if (!post) return new Response(null, { status: 404 });
  const [{ createPortfolioOgImage }, postTranslations] = await Promise.all([
    import("@/lib/og-image"),
    import("@/i18n/server").then(({ getTranslations }) =>
      getTranslations({ locale, namespace: "Metadata.og" }),
    ),
  ]);

  return createPortfolioOgImage(locale, {
    index: "03",
    eyebrow: postTranslations("blogArticle"),
    title: post.title,
    description: post.description,
    ...(post.date
      ? {
          footer: new Intl.DateTimeFormat(locale, {
            dateStyle: "long",
            timeZone: "UTC",
          }).format(new Date(post.date)),
        }
      : {}),
  });
}
