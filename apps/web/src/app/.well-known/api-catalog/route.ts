import { getApiCatalog, getApiCatalogLinkHeader } from "@portfolio/api/public-portfolio";
import { getSiteEnv } from "@portfolio/env/site";
import { publicHead, publicJson } from "@/lib/public-api-response";

const siteUrl = new URL(getSiteEnv().siteUrl);

export function GET() {
  return publicJson(getApiCatalog(siteUrl), {
    headers: {
      Link: getApiCatalogLinkHeader(siteUrl),
      "Content-Type": 'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
    },
  });
}

export function HEAD() {
  return publicHead('application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"', {
    headers: {
      Link: getApiCatalogLinkHeader(siteUrl),
    },
  });
}
