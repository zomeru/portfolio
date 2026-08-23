import { createPortfolioOgImage, OG_IMAGE_SIZE } from "@/lib/og-image";

export const alt = "Contact Zomer Gregorio";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default function OpenGraphImage() {
  return createPortfolioOgImage({
    index: "05",
    eyebrow: "Let's talk",
    title: "Have a project or interesting idea?",
    description: "Get in touch about software engineering, product work, or collaboration.",
  });
}
