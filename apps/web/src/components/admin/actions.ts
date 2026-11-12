import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const formData = z.instanceof(FormData);

export const authenticateAdminAccess = createServerFn({ method: "POST" })
  .validator(formData)
  .handler(async ({ data }) =>
    (await import("@/lib/admin-actions.server")).authenticateAdminAccess(data),
  );
export const authenticateAdmin = createServerFn({ method: "POST" })
  .validator(formData)
  .handler(async ({ data }) =>
    (await import("@/lib/admin-actions.server")).authenticateAdmin(data),
  );
export const triggerBlogGeneration = createServerFn({ method: "POST" })
  .validator(formData)
  .handler(async ({ data }) =>
    (await import("@/lib/admin-actions.server")).triggerBlogGeneration(data),
  );
export const registerWebhook = createServerFn({ method: "POST" })
  .validator(formData)
  .handler(async ({ data }) => (await import("@/lib/admin-actions.server")).registerWebhook(data));
export const testWebhook = createServerFn({ method: "POST" })
  .validator(formData)
  .handler(async ({ data }) => (await import("@/lib/admin-actions.server")).testWebhook(data));
export const disableWebhook = createServerFn({ method: "POST" })
  .validator(formData)
  .handler(async ({ data }) => (await import("@/lib/admin-actions.server")).disableWebhook(data));
export const retryNotifications = createServerFn({ method: "POST" })
  .validator(formData)
  .handler(async ({ data }) =>
    (await import("@/lib/admin-actions.server")).retryNotifications(data),
  );
export const logoutAdmin = createServerFn({ method: "POST" })
  .validator(formData)
  .handler(async ({ data }) => (await import("@/lib/admin-actions.server")).logoutAdmin(data));
export const logoutAdminAccess = createServerFn({ method: "POST" })
  .validator(formData)
  .handler(async () => (await import("@/lib/admin-actions.server")).logoutAdminAccess());
export const updateErrorStatus = createServerFn({ method: "POST" })
  .validator(formData)
  .handler(async ({ data }) =>
    (await import("@/lib/admin-actions.server")).updateErrorStatus(data),
  );
