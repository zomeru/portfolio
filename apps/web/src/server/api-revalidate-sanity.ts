import "@tanstack/react-start/server-only";
import { getSanityCacheTags } from "@portfolio/api/public-portfolio";
import { getSanityEnv } from "@portfolio/env/sanity";
import { getSanityRevalidateServerEnv } from "@portfolio/env/sanity-revalidate-server";
import { isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook";
import { z } from "zod";

const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .nullish();

const payloadSchema = z.object({
  _type: z.enum(["profile", "experience", "project", "blogPost", "techStack"]),
  previousSlug: slugSchema,
  slug: slugSchema,
});

const MAX_WEBHOOK_BYTES = 16_384;

async function readWebhookBody(request: Request) {
  if (Number(request.headers.get("content-length")) > MAX_WEBHOOK_BYTES) return null;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let body = "";
  try {
    for (let part = await reader.read(); !part.done; part = await reader.read()) {
      bytes += part.value.byteLength;
      if (bytes > MAX_WEBHOOK_BYTES) {
        await reader.cancel();
        return null;
      }
      body += decoder.decode(part.value, { stream: true });
    }
    return body + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: Request) {
  const rawBody = await readWebhookBody(request);
  if (rawBody === null) {
    return Response.json({ error: "Webhook payload is too large." }, { status: 413 });
  }
  const signature = request.headers.get(SIGNATURE_HEADER_NAME) ?? "";
  const { secret } = getSanityRevalidateServerEnv();

  if (!(await isValidSignature(rawBody, signature, secret))) {
    return Response.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  const sanity = getSanityEnv();
  if (
    request.headers.get("sanity-project-id") !== sanity.projectId ||
    request.headers.get("sanity-dataset") !== sanity.dataset
  ) {
    return Response.json({ error: "Unexpected Sanity source." }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Unsupported webhook payload." }, { status: 400 });
  }

  const tags = getSanityCacheTags(parsed.data);

  return Response.json({ revalidated: true, tags });
}
