import { createPortfolioOgImage, OG_IMAGE_SIZE } from "@/lib/og-image";

export const alt = "Software engineering articles by Zomer Gregorio";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default function OpenGraphImage() {
  return createPortfolioOgImage({
    index: "03",
    eyebrow: "Blog",
    title: "Notes on building software.",
    description: "Practical writing on architecture, tooling, AI, and web engineering.",
  });
}
