import { createServerFn } from "@tanstack/react-start";

export const getSiteData = createServerFn({ method: "GET" }).handler(async () => {
  const { getPublicSite } = await import("@portfolio/api/public-portfolio");
  return getPublicSite();
});
