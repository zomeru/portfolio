import type { AppType } from "@portfolio/api/types";
import { getCronEnv } from "@portfolio/env/cron";
import { getSanityEnv } from "@portfolio/env/sanity";
import { getSiteEnv } from "@portfolio/env/site";
import { hc } from "hono/client";

const LOOPBACK_HOSTNAMES = new Set(["127.0.0.1", "[::1]", "::1", "localhost"]);

function getCronUrl() {
  const sanityEnv = getSanityEnv();
  const siteEnv = getSiteEnv();

  if (siteEnv.nodeEnv !== "development") {
    throw new Error("Local blog cron requires NODE_ENV=development.");
  }

  if (sanityEnv.dataset !== "development") {
    throw new Error("Local blog cron requires SANITY_DATASET=development.");
  }

  const url = new URL("/api/blog/generate", siteEnv.siteUrl);

  if (!LOOPBACK_HOSTNAMES.has(url.hostname)) {
    throw new Error(`Refusing to call non-local host: ${url.hostname}`);
  }

  return url;
}

async function parseResponse(response: Pick<Response, "text">) {
  const responseBody = await response.text();

  if (!responseBody) {
    return null;
  }

  try {
    return JSON.parse(responseBody) as unknown;
  } catch {
    return responseBody;
  }
}

async function run() {
  const url = getCronUrl();
  const { secret } = getCronEnv();

  console.log(`Triggering local blog cron at ${url.toString()}`);

  const response = await hc<AppType>(url.origin).api.blog.generate.$get(
    {},
    {
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    },
  );
  const body = await parseResponse(response);

  console.log(JSON.stringify({ status: response.status, body }, null, 2));

  if (!response.ok) {
    process.exitCode = 1;
  }
}

run().catch((error: unknown) => {
  console.error("Local blog cron failed.", error);
  process.exitCode = 1;
});
