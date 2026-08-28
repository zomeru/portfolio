import { getPublicPortfolioSnapshot } from "@portfolio/api/public-portfolio";

import { siteUpdatedAt, siteUrl } from "@/lib/metadata";
import { publicText } from "@/lib/public-api-response";
import { getSchemaFeedRecords, serializeSchemaFeed } from "@/lib/schema-feed";

export const revalidate = false;

export async function GET() {
  const snapshot = await getPublicPortfolioSnapshot();
  const records = getSchemaFeedRecords(snapshot, new URL(siteUrl), siteUpdatedAt);

  return publicText(serializeSchemaFeed(records), "application/x-jsonlines; charset=utf-8");
}
