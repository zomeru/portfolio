import "@tanstack/react-start/server-only";
import { getPublicPortfolioSnapshot } from "@portfolio/api/public-portfolio";

import { getSiteUrl } from "@/lib/metadata";
import { publicText } from "@/lib/public-api-response";
import { getSchemaFeedRecords, serializeSchemaFeed } from "@/lib/schema-feed";
import { siteUpdatedAt } from "@/lib/site-version";

export async function GET() {
  const snapshot = await getPublicPortfolioSnapshot();
  const records = getSchemaFeedRecords(snapshot, new URL(getSiteUrl()), siteUpdatedAt);

  return publicText(serializeSchemaFeed(records), "application/x-jsonlines; charset=utf-8");
}
