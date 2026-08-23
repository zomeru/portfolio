"use server";

import { randomUUID } from "node:crypto";
import { apiApp, verifyAdminSecret } from "@portfolio/api";
import { getCronEnv } from "@portfolio/env/cron";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createAdminSession,
  deleteAdminSession,
  getAdminSessionToken,
  isAdminAuthenticated,
} from "@/lib/admin-session";
import type { GenerationActionState, LoginActionState, ReindexActionState } from "./action-state";

type GenerationResponse = {
  created?: boolean;
  error?: { message?: string };
  post?: {
    slug?: string;
    title?: string;
  };
  success?: boolean;
};

export async function authenticateAdmin(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const secret = formData.get("secret");

  if (typeof secret !== "string" || !verifyAdminSecret(secret)) {
    return { error: "The secret is incorrect." };
  }

  await createAdminSession();
  redirect("/admin");
}

export async function triggerBlogGeneration(
  _previousState: GenerationActionState,
  _formData: FormData,
): Promise<GenerationActionState> {
  if (!(await isAdminAuthenticated())) {
    return { status: "error", message: "Your admin session expired. Refresh and sign in again." };
  }

  try {
    const response = await apiApp.request("http://portfolio.internal/api/blog/generate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getCronEnv().secret}`,
        "Idempotency-Key": `admin:${randomUUID()}`,
      },
    });
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
      message: payload.created
        ? "The article was generated and published."
        : "This request resolved to an existing generated article.",
      post: { slug: payload.post.slug, title: payload.post.title },
    };
  } catch {
    return {
      status: "error",
      message: "Blog generation could not be completed. Try again or inspect server logs.",
    };
  }
}

export async function triggerKnowledgeReindex(
  _previousState: ReindexActionState,
  formData: FormData,
): Promise<ReindexActionState> {
  const token = await getAdminSessionToken();
  if (!token) {
    return { status: "error", message: "Your admin session expired. Refresh and sign in again." };
  }

  try {
    const response = await apiApp.request("http://portfolio.internal/api/admin/ai/reindex", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ force: formData.get("force") === "on" }),
    });
    const payload = (await response.json()) as {
      documentsSeen?: number;
      documentsUnchanged?: number;
      chunksCreated?: number;
      error?: { message?: string };
      status?: string;
    };

    if (!response.ok || payload.status !== "completed") {
      return {
        status: "error",
        message: payload.error?.message ?? "Knowledge indexing failed. Inspect the server logs.",
      };
    }

    revalidatePath("/admin");
    return {
      status: "success",
      message: `Indexed ${payload.documentsSeen ?? 0} documents and created ${payload.chunksCreated ?? 0} chunks. ${payload.documentsUnchanged ?? 0} documents were unchanged.`,
    };
  } catch {
    return {
      status: "error",
      message: "Knowledge indexing could not be completed. Try again or inspect server logs.",
    };
  }
}

export async function logoutAdmin() {
  await deleteAdminSession();
  redirect("/admin");
}
