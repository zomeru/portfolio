import { getAgentSkillsIndex } from "@portfolio/api/public-portfolio";
import { getSiteEnv } from "@portfolio/env/site";

import { publicJson } from "@/lib/public-api-response";

export function GET() {
  return publicJson(getAgentSkillsIndex(new URL(getSiteEnv().siteUrl)));
}
