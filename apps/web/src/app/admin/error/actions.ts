"use server";

import type { AdminErrorStatus } from "@portfolio/api/types";
import { refresh } from "next/cache";

import { getAdminAccessSessionToken, isAdminAccessAuthenticated } from "@/lib/admin-access";
import { serverClient } from "@/lib/api-server";

const statuses = new Set<AdminErrorStatus>(["open", "resolved", "ignored"]);

export async function updateErrorStatus(formData: FormData) {
  if (!(await isAdminAccessAuthenticated())) return;
  const token = await getAdminAccessSessionToken();
  const id = formData.get("id");
  const status = formData.get("status");
  if (
    !token ||
    typeof id !== "string" ||
    typeof status !== "string" ||
    !statuses.has(status as AdminErrorStatus)
  ) {
    return;
  }

  await serverClient.api.admin.errors[":id"].status.$patch(
    { param: { id }, json: { status: status as AdminErrorStatus } },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  refresh();
}
