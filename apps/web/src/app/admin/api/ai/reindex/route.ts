import { getAdminSessionToken } from "@/lib/admin-session";
import { serverClient } from "@/lib/api-server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const token = await getAdminSessionToken("ai-reindex");
  if (!token) {
    return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  return serverClient.api.admin.ai.reindex.stream.$post(
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      init: { body: await request.text() },
    },
  );
}
