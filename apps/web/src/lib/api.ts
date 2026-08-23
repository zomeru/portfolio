import type { AppType } from "@portfolio/api/types";
import { getSiteEnv } from "@portfolio/env/site";
import { type ClientRequestOptions, hc } from "hono/client";

type Client = ReturnType<typeof hc<AppType>>;

let _client: Client | undefined;

export function createApiClient(baseUrl: string, options?: ClientRequestOptions): Client {
  return hc<AppType>(baseUrl, options);
}

function getClient(): Client {
  const siteUrl = typeof window === "undefined" ? getSiteEnv().siteUrl : window.location.origin;

  if (!_client) {
    _client = createApiClient(siteUrl, {
      init: {
        credentials: "include",
      },
    });
  }
  return _client;
}

export const client = new Proxy({} as Client, {
  get(_target, key: string) {
    return getClient()[key as keyof Client];
  },
});
