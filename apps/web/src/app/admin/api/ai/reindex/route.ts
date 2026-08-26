import { logError } from "@portfolio/api/logging";
import { getAdminSessionToken } from "@/lib/admin-session";
import { serverClient } from "@/lib/api-server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const token = await getAdminSessionToken("ai-reindex");
  if (!token) {
    return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  try {
    return await serverClient.api.admin.ai.reindex.stream.$post(
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        init: { body: await request.text() },
      },
    );
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
