import { getPublicBlogPost } from "@portfolio/api/public-portfolio";
import { createPortfolioOgImage, OG_IMAGE_SIZE } from "@/lib/og-image";

export const alt = "Blog article by Zomer Gregorio";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublicBlogPost(slug);

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
