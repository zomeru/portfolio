import "@tanstack/react-start/server-only";
import { logError } from "@portfolio/api/logging";

import { isAdminAccessAuthenticated } from "@/lib/admin-access";
import { getAdminSessionToken } from "@/lib/admin-session";
import { serverClient } from "@/lib/api-server";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return Response.json({ error: { message: "Forbidden" } }, { status: 403 });
  }
  const [hasPageAccess, token] = await Promise.all([
    isAdminAccessAuthenticated(),
    getAdminSessionToken("ai-reindex"),
  ]);
  if (!hasPageAccess || !token) {
    return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  try {
    const response = await serverClient.api.admin.ai.reindex.stream.$post(
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        init: { body: await request.text() },
      },
    );
    return new Response(response.body, { status: response.status, headers: response.headers });
  } catch (error) {
    logError("admin reindex proxy failed", error, {
      operation: "web.admin.proxyReindex",
    });
    return Response.json(
      { error: { message: "Knowledge indexing could not be started." } },
      { status: 502 },
    );
  }
}
