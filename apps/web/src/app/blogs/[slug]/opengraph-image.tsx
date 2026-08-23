import { createPortfolioOgImage, OG_IMAGE_SIZE } from "@/lib/og-image";
import { getBlogPostBySlug } from "@/lib/sanity/services/blog";

export const alt = "Blog article by Zomer Gregorio";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  return createPortfolioOgImage({
    index: "03",
    eyebrow: "Blog article",
    title: post?.title ?? "Software engineering notes.",
    description: post?.description ?? "Practical notes on building reliable software.",
    ...(post?.date
      ? {
          footer: new Intl.DateTimeFormat("en-US", {
            dateStyle: "long",
            timeZone: "UTC",
          }).format(new Date(post.date)),
        }
      : {}),
  });
}
