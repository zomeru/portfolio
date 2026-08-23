"use server";

import { randomUUID } from "node:crypto";
import { type AdminCapability, verifyAdminSecret } from "@portfolio/api";
import { getCronEnv } from "@portfolio/env/cron";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminSession, deleteAdminSession, isAdminAuthenticated } from "@/lib/admin-session";
import { serverClient } from "@/lib/api-server";
import type { GenerationActionState, LoginActionState } from "./action-state";

type GenerationResponse = {
  created?: boolean;
  error?: { message?: string };
  indexing?: { status?: "failed" | "succeeded" | "unchanged" };
  post?: {
    slug?: string;
    title?: string;
  };
  success?: boolean;
};

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
        payload.indexing?.status === "failed"
          ? "The article was published, but its AI index update failed. Use Reindex AI data below to retry."
          : payload.created
            ? "The article was generated, published, and indexed for Ask Zomer AI."
            : "This request resolved to an existing generated article and refreshed its AI index.",
      post: { slug: payload.post.slug, title: payload.post.title },
    };
  } catch {
    return {
      status: "error",
      message: "Blog generation could not be completed. Try again or inspect server logs.",
    };
  }
}

export async function logoutAdmin(formData: FormData) {
  const capability = parseAdminCapability(formData.get("capability"));
  if (capability) await deleteAdminSession(capability);
  redirect("/admin");
}
