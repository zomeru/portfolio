import "client-only";
import type { AppType } from "@portfolio/api/types";
import { type ClientRequestOptions, hc } from "hono/client";

type Client = ReturnType<typeof hc<AppType>>;

let _client: Client | undefined;

export function createApiClient(baseUrl: string, options?: ClientRequestOptions): Client {
  return hc<AppType>(baseUrl, options);
}

function getClient(): Client {
  if (!_client) {
    _client = createApiClient(window.location.origin, {
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
