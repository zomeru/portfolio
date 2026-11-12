import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const errorSearch = z.object({
  cursor: z.string().max(512).optional(),
  q: z.string().max(200).optional(),
  severity: z.enum(["error", "warning"]).optional(),
  status: z.enum(["open", "resolved", "ignored"]).optional(),
});

export type ErrorSearch = z.infer<typeof errorSearch>;

export function parseErrorSearch(search: Record<string, unknown>) {
  return {
    cursor: typeof search.cursor === "string" ? search.cursor.slice(0, 512) : undefined,
    q: typeof search.q === "string" ? search.q.trim().slice(0, 200) : undefined,
    severity: errorSearch.shape.severity.safeParse(search.severity).data,
    status: errorSearch.shape.status.safeParse(search.status).data,
  };
}

export const loadDashboard = createServerFn({ method: "GET" }).handler(async () =>
  (await import("./admin-data.server")).getDashboard(),
);

export const loadErrors = createServerFn({ method: "GET" })
  .validator(errorSearch)
  .handler(async ({ data }) => (await import("./admin-data.server")).getErrors(data));

export const loadErrorDetail = createServerFn({ method: "GET" })
  .validator(z.string().max(128))
  .handler(async ({ data }) => (await import("./admin-data.server")).getErrorDetail(data));
