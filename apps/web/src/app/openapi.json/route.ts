import { getOpenApiDocument } from "@portfolio/api/public-portfolio";
import { getSiteEnv } from "@portfolio/env/site";
import { publicJson } from "@/lib/public-api-response";

export function GET() {
  return publicJson(getOpenApiDocument(new URL(getSiteEnv().siteUrl)), {
    headers: { "Content-Type": "application/vnd.oai.openapi+json;version=3.2" },
  });
}
