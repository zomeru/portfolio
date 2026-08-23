import { createPortfolioOgImage, OG_IMAGE_SIZE } from "@/lib/og-image";

export const alt = "Selected projects by Zomer Gregorio";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default function OpenGraphImage() {
  return createPortfolioOgImage({
    index: "02",
    eyebrow: "Projects",
    title: "Selected work.",
    description: "Product engineering, systems, and software built across the stack.",
  });
}
