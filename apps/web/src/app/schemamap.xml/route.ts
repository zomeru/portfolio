import { siteUpdatedAt, siteUrl } from "@/lib/metadata";
import { publicText } from "@/lib/public-api-response";
import { getSchemaMapXml } from "@/lib/schema-feed";

export function GET() {
  return publicText(
    getSchemaMapXml(new URL(siteUrl), siteUpdatedAt),
    "application/xml; charset=utf-8",
  );
}
