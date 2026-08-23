import { createPortfolioOgImage, OG_IMAGE_SIZE } from "@/lib/og-image";

export const alt = "Ask Zomer AI";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default function OpenGraphImage() {
  return createPortfolioOgImage({
    index: "04",
    eyebrow: "Ask Zomer AI",
    title: "A grounded guide to my work.",
    description: "Ask about experience, projects, technical strengths, and published writing.",
  });
}
