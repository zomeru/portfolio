import { apiApp } from "@portfolio/api";
import { getAdminSessionToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const token = await getAdminSessionToken("ai-reindex");
  if (!token) {
    return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  return apiApp.request("http://portfolio.internal/api/admin/ai/reindex/stream", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: await request.text(),
  });
}
