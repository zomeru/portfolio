import { createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    defaultPreload: "intent",
    // Published content is served from a 60-second edge cache, so client navigation can reuse
    // loader data for the same window. Admin routes opt out and invalidate after mutations.
    defaultStaleTime: 60_000,
    scrollRestoration: true,
    trailingSlash: "never",
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
