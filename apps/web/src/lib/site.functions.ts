import { createServerFn } from "@tanstack/react-start";

export const getSiteData = createServerFn({ method: "GET" }).handler(async () => {
  const { getPublicProfile, getPublicTechStack } = await import("@portfolio/api/public-portfolio");
  const { getSiteEnv } = await import("@portfolio/env/site");
  const [profile, techStack] = await Promise.all([getPublicProfile(), getPublicTechStack()]);
  return { profile, techStack: techStack.groups, siteUrl: getSiteEnv().siteUrl };
});
