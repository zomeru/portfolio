import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import vm from "node:vm";

class MemoryCache {
  readonly values = new Map<string, Response>();

  async addAll(urls: string[]) {
    for (const url of urls) {
      this.values.set(new URL(url, "https://zomeru.dev").href, new Response(url));
    }
  }

  async delete(request: Request | string) {
    return this.values.delete(typeof request === "string" ? request : request.url);
  }

  async keys() {
    return [...this.values.keys()].map((url) => new Request(url));
  }

  async match(request: Request | string) {
    return this.values.get(
      typeof request === "string" ? new URL(request, "https://zomeru.dev").href : request.url,
    );
  }

  async put(request: Request | string, response: Response) {
    this.values.set(typeof request === "string" ? request : request.url, response);
  }
}

class MemoryCaches {
  readonly stores = new Map<string, MemoryCache>();

  async delete(name: string) {
    return this.stores.delete(name);
  }

  async keys() {
    return [...this.stores.keys()];
  }

  async match(request: Request | string) {
    for (const cache of this.stores.values()) {
      const response = await cache.match(request);
      if (response) return response;
    }
  }

  async open(name: string) {
    let cache = this.stores.get(name);
    if (!cache) {
      cache = new MemoryCache();
      this.stores.set(name, cache);
    }
    return cache;
  }
}

function basicResponse(body: string, contentType: string) {
  const response = new Response(body, {
    headers: { "Cache-Control": "public, max-age=0", "Content-Type": contentType },
  });
  Object.defineProperty(response, "type", { configurable: true, value: "basic" });
  Object.defineProperty(response, "clone", {
    configurable: true,
    value: () => basicResponse(body, contentType),
  });
  return response;
}

async function createHarness() {
  const listeners = new Map<string, (event: any) => void>();
  const memoryCaches = new MemoryCaches();
  let online = true;
  const self = {
    addEventListener(type: string, listener: (event: any) => void) {
      listeners.set(type, listener);
    },
    clients: {
      claim: async () => undefined,
      matchAll: async () => [],
      openWindow: async () => undefined,
    },
    location: { origin: "https://zomeru.dev" },
    registration: { showNotification: async () => undefined },
    skipWaiting: () => undefined,
  };
  const source = await readFile(new URL("../../../public/sw.js", import.meta.url), "utf8");
  vm.runInNewContext(source, {
    caches: memoryCaches,
    fetch: async (request: Request) => {
      if (!online) throw new TypeError("offline");
      const accept = request.headers?.get("accept") ?? "";
      return basicResponse(
        `<main>${new URL(request.url).pathname}</main>`,
        accept.includes("text/x-component") ? "text/x-component" : "text/html",
      );
    },
    Headers,
    Promise,
    Request,
    Response,
    self,
    setTimeout,
    URL,
  });

  async function dispatch(type: string, event: Record<string, unknown> = {}) {
    const waits: Promise<unknown>[] = [];
    let responsePromise: Promise<Response> | undefined;
    listeners.get(type)?.({
      ...event,
      respondWith(value: Promise<Response>) {
        responsePromise = Promise.resolve(value);
      },
      waitUntil(value: Promise<unknown>) {
        waits.push(Promise.resolve(value));
      },
    });
    const response = await responsePromise;
    await Promise.all(waits);
    return response;
  }

  return {
    caches: memoryCaches,
    dispatch,
    listeners,
    setOnline(value: boolean) {
      online = value;
    },
  };
}

function navigationRequest(path: string) {
  return {
    destination: "document",
    headers: new Headers({ Accept: "text/html" }),
    method: "GET",
    mode: "navigate",
    url: `https://zomeru.dev${path}`,
  };
}

async function responseText(response: Response | undefined) {
  assert.ok(response);
  return response.text();
}

void describe("portfolio service worker", () => {
  void it("installs the last-resort assets and serves a previously visited route offline", async () => {
    const harness = await createHarness();
    await harness.dispatch("install");
    assert.ok(await harness.caches.match("/offline.html"));
    assert.ok(await harness.caches.match("/manifest.json"));

    const request = navigationRequest("/en/projects");
    const online = await harness.dispatch("fetch", { request });
    assert.match(await responseText(online), /\/en\/projects/u);
    harness.setOnline(false);
    const offline = await harness.dispatch("fetch", { request });
    assert.match(await responseText(offline), /\/en\/projects/u);
  });

  void it("uses the fallback only for a public route that was never cached", async () => {
    const harness = await createHarness();
    await harness.dispatch("install");
    harness.setOnline(false);
    const response = await harness.dispatch("fetch", {
      request: navigationRequest("/en/blogs/uncached"),
    });
    assert.match(await responseText(response), /offline\.html/u);
  });

  void it("warms the locale home so an installed app can reopen from its root URL offline", async () => {
    const harness = await createHarness();
    await harness.dispatch("install");
    await harness.dispatch("message", {
      data: { type: "CACHE_ROUTE_IF_MISSING", url: "https://zomeru.dev/en" },
    });
    harness.setOnline(false);

    const response = await harness.dispatch("fetch", { request: navigationRequest("/") });
    assert.match(await responseText(response), /\/en/u);
  });

  void it("does not retain sensitive locale utility routes", async () => {
    const harness = await createHarness();
    await harness.dispatch("install");
    const request = navigationRequest("/en/blogs/unsubscribe?token=secret");
    await harness.dispatch("fetch", { request });
    harness.setOnline(false);

    const response = await harness.dispatch("fetch", { request });
    assert.match(await responseText(response), /offline\.html/u);
  });

  void it("never intercepts private APIs or admin pages", async () => {
    const harness = await createHarness();
    let responded = false;
    harness.listeners.get("fetch")?.({
      request: { ...navigationRequest("/api/ai/sessions/private/messages"), mode: "cors" },
      respondWith() {
        responded = true;
      },
    });
    assert.equal(responded, false);
  });

  void it("removes older app caches while preserving one rollback generation and model storage", async () => {
    const harness = await createHarness();
    await harness.caches.open("zomer-navigation-v1");
    await harness.caches.open("zomer-navigation-v2");
    await harness.caches.open("webllm/model");
    await harness.dispatch("activate");
    const keys = await harness.caches.keys();
    assert.equal(keys.includes("zomer-navigation-v1"), false);
    assert.equal(keys.includes("zomer-navigation-v2"), true);
    assert.equal(keys.includes("webllm/model"), true);
  });
});
