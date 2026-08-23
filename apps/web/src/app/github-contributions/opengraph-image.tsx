import { createPortfolioOgImage, OG_IMAGE_SIZE } from "@/lib/og-image";

export const alt = "GitHub contributions by Zomer Gregorio";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default function OpenGraphImage() {
  return createPortfolioOgImage({
    index: "04",
    eyebrow: "GitHub Contributions",
    title: "Contribution activity and commits.",
    description: "GitHub contributions and authored commit history across repositories I own.",
  });
}
