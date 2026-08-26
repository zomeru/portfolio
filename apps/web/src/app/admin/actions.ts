"use server";

import { randomUUID } from "node:crypto";
import { type AdminCapability, verifyAdminSecret } from "@portfolio/api";
import { logError } from "@portfolio/api/logging";
import { getCronEnv } from "@portfolio/env/cron";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createAdminSession,
  deleteAdminSession,
  getAdminSessionToken,
  isAdminAuthenticated,
} from "@/lib/admin-session";
import { serverClient } from "@/lib/api-server";
import type {
  GenerationActionState,
  LoginActionState,
  NotificationRetryActionState,
  WebhookMutationActionState,
  WebhookRegistrationActionState,
} from "./action-state";

type GenerationResponse = {
  created?: boolean;
  error?: { message?: string };
  indexing?: { status?: "failed" | "succeeded" | "unchanged" };
  notifications?: { status?: "failed" | "succeeded" };
  post?: {
    slug?: string;
    title?: string;
  };
  success?: boolean;
};

type WebhookMutationResponse = {
  error?: { message?: string };
  secret?: string | null;
  success?: boolean;
};

type NotificationDeliverySummary = Record<
  "email" | "push" | "webhook",
  {
    attempted: number;
    failed: number;
    skipped: number;
    staleSubscriptionsRemoved: number;
    succeeded: number;
  }
>;

type NotificationRetryResponse = {
  deliveries?: NotificationDeliverySummary;
  error?: { message?: string };
  success?: boolean;
};

const webhookRegistrationSchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(100, "Use 100 characters or fewer."),
  destinationType: z.enum(["discord", "slack", "generic"], {
    error: "Choose a destination type.",
  }),
  url: z
    .url("Enter a complete HTTPS webhook URL.")
    .max(2_048, "The URL is too long.")
    .refine((value) => value.startsWith("https://"), "Use an HTTPS webhook URL."),
});
const webhookIdSchema = z.uuid();

function parseAdminCapability(value: FormDataEntryValue | null): AdminCapability | null {
  return value === "blog-generation" || value === "ai-reindex" ? value : null;
}

export async function authenticateAdmin(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const secret = formData.get("secret");
  const capability = parseAdminCapability(formData.get("capability"));

  if (!capability || typeof secret !== "string" || !verifyAdminSecret(secret, capability)) {
    return { error: "The secret is incorrect." };
  }

  await createAdminSession(capability);
  redirect("/admin");
}

export async function triggerBlogGeneration(
  _previousState: GenerationActionState,
  _formData: FormData,
): Promise<GenerationActionState> {
  if (!(await isAdminAuthenticated("blog-generation"))) {
    return {
      status: "error",
      message: "Your publishing access expired. Refresh and unlock it again.",
    };
  }

  try {
    const response = await serverClient.api.blog.generate.$post(
      {},
      {
        headers: {
          Authorization: `Bearer ${getCronEnv().secret}`,
          "Idempotency-Key": `admin:${randomUUID()}`,
        },
      },
    );
    const payload = (await response.json()) as GenerationResponse;

    if (!response.ok || !payload.success || !payload.post?.slug || !payload.post.title) {
      return {
        status: "error",
        message:
          payload.error?.message ?? "Blog generation failed. Try again or inspect server logs.",
      };
    }

    revalidatePath("/blogs");
    revalidatePath(`/blogs/${payload.post.slug}`);

    return {
      status: "success",
      message:
        payload.indexing?.status === "failed" && payload.notifications?.status === "failed"
          ? "The article was published, but notification dispatch and its AI index update failed. Inspect server logs, then retry both operations."
          : payload.notifications?.status === "failed"
            ? "The article was published, but notification dispatch failed. Inspect server logs and retry publishing to reuse its stable event."
            : payload.indexing?.status === "failed"
              ? "The article was published, but its AI index update failed. Use Reindex AI data below to retry."
              : payload.created
                ? "The article was generated, published, and indexed for Ask Zomer AI."
                : "This request resolved to an existing generated article and refreshed its AI index.",
      post: { slug: payload.post.slug, title: payload.post.title },
    };
  } catch (error) {
    logError("admin blog generation action failed", error, {
      operation: "web.admin.triggerBlogGeneration",
    });
    return {
      status: "error",
      message: "Blog generation could not be completed. Try again or inspect server logs.",
    };
  }
}

export async function registerWebhook(
  _previousState: WebhookRegistrationActionState,
  formData: FormData,
): Promise<WebhookRegistrationActionState> {
  const token = await getAdminSessionToken("blog-generation");
  if (!token) {
    return {
      status: "error",
      message: "Your publishing access expired. Refresh and unlock it again.",
    };
  }
  const parsed = webhookRegistrationSchema.safeParse({
    name: formData.get("name"),
    destinationType: formData.get("destinationType"),
    url: formData.get("url"),
  });
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: {
        ...(errors.name?.[0] ? { name: errors.name[0] } : {}),
        ...(errors.destinationType?.[0] ? { destinationType: errors.destinationType[0] } : {}),
        ...(errors.url?.[0] ? { url: errors.url[0] } : {}),
      },
    };
  }

  try {
    const response = await serverClient.api.notifications.webhooks.$post(
      {
        json: {
          ...parsed.data,
          events: ["blog.published"],
        },
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const payload = (await response.json()) as WebhookMutationResponse & {
      webhook?: { secret?: string | null };
    };
    if (!response.ok || !payload.success) {
      return {
        status: "error",
        message: payload.error?.message ?? "Unable to register the webhook. Check the URL.",
      };
    }
    revalidatePath("/admin");
    return {
      status: "success",
      message: `${parsed.data.name} is connected. Send a test to verify the destination.`,
      ...(payload.webhook?.secret ? { secret: payload.webhook.secret } : {}),
    };
  } catch (error) {
    logError("admin webhook registration failed", error, {
      operation: "web.admin.registerWebhook",
      destinationType: parsed.data.destinationType,
    });
    return {
      status: "error",
      message: "Unable to register the webhook. Check server logs and try again.",
    };
  }
}

export async function testWebhook(
  _previousState: WebhookMutationActionState,
  formData: FormData,
): Promise<WebhookMutationActionState> {
  const token = await getAdminSessionToken("blog-generation");
  const id = webhookIdSchema.safeParse(formData.get("id"));
  if (!token) {
    return {
      status: "error",
      message: "Your publishing access expired. Refresh and unlock it again.",
    };
  }
  if (!id.success) return { status: "error", message: "The webhook identifier is invalid." };

  try {
    const response = await serverClient.api.notifications.webhooks[":id"].test.$post(
      { param: { id: id.data } },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const payload = (await response.json()) as WebhookMutationResponse;
    return response.ok && payload.success
      ? { status: "success", message: "Test delivered. Check the destination." }
      : {
          status: "error",
          message: payload.error?.message ?? "The test could not be delivered.",
        };
  } catch (error) {
    logError("admin webhook test failed", error, {
      operation: "web.admin.testWebhook",
      webhookId: id.data,
    });
    return { status: "error", message: "The test could not be delivered. Check server logs." };
  }
}

export async function disableWebhook(
  _previousState: WebhookMutationActionState,
  formData: FormData,
): Promise<WebhookMutationActionState> {
  const token = await getAdminSessionToken("blog-generation");
  const id = webhookIdSchema.safeParse(formData.get("id"));
  if (!token) {
    return {
      status: "error",
      message: "Your publishing access expired. Refresh and unlock it again.",
    };
  }
  if (!id.success) return { status: "error", message: "The webhook identifier is invalid." };

  try {
    const response = await serverClient.api.notifications.webhooks[":id"].$delete(
      { param: { id: id.data } },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const payload = (await response.json()) as WebhookMutationResponse;
    if (!response.ok || !payload.success) {
      return {
        status: "error",
        message: payload.error?.message ?? "The webhook could not be disabled.",
      };
    }
    revalidatePath("/admin");
    return { status: "success", message: "Webhook disabled." };
  } catch (error) {
    logError("admin webhook disable failed", error, {
      operation: "web.admin.disableWebhook",
      webhookId: id.data,
    });
    return { status: "error", message: "The webhook could not be disabled. Check server logs." };
  }
}

export async function retryNotifications(
  _previousState: NotificationRetryActionState,
  _formData: FormData,
): Promise<NotificationRetryActionState> {
  const token = await getAdminSessionToken("blog-generation");
  if (!token) {
    return {
      status: "error",
      message: "Your publishing access expired. Refresh and unlock it again.",
    };
  }

  try {
    const response = await serverClient.api.notifications.retry.$post(
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const payload = (await response.json()) as NotificationRetryResponse;
    if (!response.ok || !payload.success || !payload.deliveries) {
      return {
        status: "error",
        message: payload.error?.message ?? "Queued notifications could not be retried.",
      };
    }

    const totals = Object.values(payload.deliveries).reduce(
      (summary, channel) => ({
        attempted: summary.attempted + channel.attempted,
        failed: summary.failed + channel.failed,
        skipped: summary.skipped + channel.skipped,
        succeeded: summary.succeeded + channel.succeeded,
      }),
      { attempted: 0, failed: 0, skipped: 0, succeeded: 0 },
    );
    revalidatePath("/admin");

    return totals.attempted === 0
      ? { status: "success", message: "No queued notifications are ready to retry." }
      : {
          status: totals.failed > 0 ? "error" : "success",
          message: `Retried ${totals.attempted}: ${totals.succeeded} delivered, ${totals.failed} failed, and ${totals.skipped} skipped.`,
        };
  } catch (error) {
    logError("admin notification retry failed", error, {
      operation: "web.admin.retryNotifications",
    });
    return {
      status: "error",
      message: "Queued notifications could not be retried. Check server logs and try again.",
    };
  }
}

export async function logoutAdmin(formData: FormData) {
  const capability = parseAdminCapability(formData.get("capability"));
  if (capability) await deleteAdminSession(capability);
  redirect("/admin");
}
