import { getPublicProfile } from "@portfolio/api/public-portfolio";

import { createPortfolioOgImage, OG_IMAGE_SIZE } from "@/lib/og-image";

export const alt = "Zomer Gregorio portfolio";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const profile = await getPublicProfile();
  const name = profile?.name || "Zomer Gregorio";
  const role = profile?.role || "Software Engineer";
  const description = `${role} based in the, building modern web experiences with Next.js, TypeScript, and practical AI integrations`;

  return createPortfolioOgImage({
    index: "01",
    eyebrow: "Portfolio",
    title: name,
    description,
  });
}
