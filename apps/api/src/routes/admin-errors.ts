import { Hono } from "hono";
import { validator } from "hono/validator";
import { z } from "zod";

import { ApiError } from "../errors";
import { verifyAdminAccessToken } from "../lib/admin-access";
import {
  decodeErrorIssueCursor,
  loadErrorIssue,
  loadErrorIssues,
  setErrorIssueStatus,
} from "../services/error-monitoring";
import type { ApiEnv } from "../types/hono";

const listQuerySchema = z.object({
  cursor: z.string().max(512).optional(),
  status: z.enum(["open", "resolved", "ignored"]).optional(),
  severity: z.enum(["error", "warning"]).optional(),
  q: z.string().trim().max(200).optional(),
});
const idSchema = z.uuid();
const statusSchema = z.object({ status: z.enum(["open", "resolved", "ignored"]) });

function noStore(c: { header: (name: string, value: string) => void }) {
  c.header("Cache-Control", "private, no-store");
  c.header("X-Robots-Tag", "noindex, nofollow, noarchive");
}

function requireAdmin(authorization: string | undefined) {
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!verifyAdminAccessToken(token)) {
    throw new ApiError("Unauthorized", { code: "UNAUTHORIZED", status: 401 });
  }
}

function invalidRequest(cause?: unknown): never {
  throw new ApiError("The error-monitoring request is invalid.", {
    code: "ADMIN_REQUEST_INVALID",
    status: 400,
    cause,
  });
}

export const adminErrorRoutes = new Hono<ApiEnv>()
  .use("*", async (c, next) => {
    noStore(c);
    requireAdmin(c.req.header("Authorization"));
    await next();
  })
  .get(
    "/",
    validator("query", (value) => {
      const query = listQuerySchema.safeParse(value);
      if (!query.success) invalidRequest(query.error);
      return query.data;
    }),
    async (c) => {
      const query = c.req.valid("query");
      const cursor = query.cursor ? decodeErrorIssueCursor(query.cursor) : undefined;
      if (query.cursor && !cursor) invalidRequest();
      return c.json(
        await loadErrorIssues({
          ...(query.status ? { status: query.status } : {}),
          ...(query.severity ? { severity: query.severity } : {}),
          ...(query.q ? { search: query.q } : {}),
          ...(cursor ? { cursor } : {}),
        }),
      );
    },
  )
  .get("/:id", async (c) => {
    const id = idSchema.safeParse(c.req.param("id"));
    if (!id.success) invalidRequest(id.error);
    const issue = await loadErrorIssue(id.data);
    if (!issue) {
      return c.json({ error: { code: "NOT_FOUND", message: "Error issue not found." } }, 404);
    }
    return c.json({ issue });
  })
  .patch(
    "/:id/status",
    validator("json", (value) => {
      const body = statusSchema.safeParse(value);
      if (!body.success) invalidRequest(body.error);
      return body.data;
    }),
    async (c) => {
      const id = idSchema.safeParse(c.req.param("id"));
      if (!id.success) invalidRequest(id.error);
      const issue = await setErrorIssueStatus(id.data, c.req.valid("json").status);
      if (!issue) {
        return c.json({ error: { code: "NOT_FOUND", message: "Error issue not found." } }, 404);
      }
      return c.json({ issue });
    },
  );
