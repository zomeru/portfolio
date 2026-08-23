import { createPortfolioOgImage, OG_IMAGE_SIZE } from "@/lib/og-image";
import { getProfile } from "@/lib/sanity/services/profile";

export const alt = "Zomer Gregorio portfolio";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const profile = await getProfile();
  const name = profile?.name || "Zomer Gregorio";
  const description = profile?.role
    ? `${profile.role} — selected work, technical writing, and a grounded AI guide.`
    : "Software engineering, selected work, technical writing, and a grounded AI guide.";

  return createPortfolioOgImage({
    index: "01",
    eyebrow: "Portfolio",
    title: name,
    description,
  });
}
