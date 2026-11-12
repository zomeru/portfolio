import "@tanstack/react-start/server-only";
import { getSiteUrl } from "@/lib/metadata";
import { publicText } from "@/lib/public-api-response";
import { getSchemaMapXml } from "@/lib/schema-feed";
import { siteUpdatedAt } from "@/lib/site-version";

export function GET() {
  return publicText(
    getSchemaMapXml(new URL(getSiteUrl()), siteUpdatedAt),
    "application/xml; charset=utf-8",
  );
}
