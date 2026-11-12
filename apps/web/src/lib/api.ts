import type { AppType } from "@portfolio/api/types";
import { createClientOnlyFn } from "@tanstack/react-start";
import { type ClientRequestOptions, hc } from "hono/client";

type Client = ReturnType<typeof hc<AppType>>;

let _client: Client | undefined;

function createApiClient(baseUrl: string, options?: ClientRequestOptions): Client {
  return hc<AppType>(baseUrl, options);
}

const getClient = createClientOnlyFn((): Client => {
  if (!_client) {
    _client = createApiClient(window.location.origin, {
      init: {
        credentials: "include",
      },
    });
  }
  return _client;
});

export const client = new Proxy({} as Client, {
  get(_target, key: string) {
    return getClient()[key as keyof Client];
  },
});
