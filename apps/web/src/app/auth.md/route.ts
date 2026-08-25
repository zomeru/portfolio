import { getSiteEnv } from "@portfolio/env/site";
import { getAuthenticationGuideMarkdown } from "@/lib/developer-docs";
import { publicText } from "@/lib/public-api-response";

export function GET() {
  return publicText(
    getAuthenticationGuideMarkdown(new URL(getSiteEnv().siteUrl)),
    "text/markdown; charset=utf-8",
  );
}
