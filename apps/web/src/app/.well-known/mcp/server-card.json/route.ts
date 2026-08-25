import { getPortfolioMcpServerCard } from "@portfolio/api/public-portfolio";
import { getSiteEnv } from "@portfolio/env/site";
import { publicJson } from "@/lib/public-api-response";

export function GET() {
  return publicJson(getPortfolioMcpServerCard(new URL(getSiteEnv().siteUrl)));
}
