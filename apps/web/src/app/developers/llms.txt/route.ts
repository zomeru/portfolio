import { getSiteEnv } from "@portfolio/env/site";
import { getDeveloperLlmsText } from "@/lib/developer-docs";
import { publicText } from "@/lib/public-api-response";

export function GET() {
  return publicText(
    getDeveloperLlmsText(new URL(getSiteEnv().siteUrl)),
    "text/plain; charset=utf-8",
  );
}
