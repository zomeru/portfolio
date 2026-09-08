import "server-only";
import { logError } from "@portfolio/api/logging";
import { getBlogPostCacheTags } from "@portfolio/api/public-portfolio";
import { revalidateTag } from "next/cache";

export function revalidateBlogCache(slug?: string | null) {
  const tags = getBlogPostCacheTags(slug);
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return tags;
}

type BlogGenerationPayload = {
  post?: {
    slug?: string;
  };
  success?: boolean;
};

export async function revalidateBlogGeneration(request: Request, response: Response) {
  if (!response.ok) return;

  let payload: BlogGenerationPayload;
  try {
    payload = (await response.clone().json()) as BlogGenerationPayload;
  } catch {
    return;
  }

  if (payload?.success !== true) return;
  const slug = payload.post?.slug;
  if (typeof slug !== "string" || slug.length === 0) return;

  try {
    revalidateBlogCache(slug);
  } catch (error) {
    logError("blog generation cache invalidation failed", error, {
      operation: "web.blog.revalidateGeneration",
      trigger: request.method === "GET" ? "scheduled" : "manual",
    });
  }
}
