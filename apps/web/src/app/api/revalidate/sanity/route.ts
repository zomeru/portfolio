import { getSanityEnv } from "@portfolio/env/sanity";
import { getSanityRevalidateServerEnv } from "@portfolio/env/sanity-revalidate-server";
import { isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook";
import { revalidateTag } from "next/cache";
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

const SLUGGED_TYPES = new Set(["experience", "project", "blogPost"]);
const MAX_WEBHOOK_BYTES = 16_384;

function getAffectedTags(payload: z.infer<typeof payloadSchema>) {
  const tags = new Set<string>([payload._type]);
  if (!SLUGGED_TYPES.has(payload._type)) return [...tags];

  if (payload.slug) tags.add(`${payload._type}:${payload.slug}`);
  if (payload.previousSlug) tags.add(`${payload._type}:${payload.previousSlug}`);
  return [...tags];
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_WEBHOOK_BYTES) {
    return Response.json({ error: "Webhook payload is too large." }, { status: 413 });
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_WEBHOOK_BYTES) {
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

  const tags = getAffectedTags(parsed.data);
  for (const tag of tags) revalidateTag(tag, { expire: 0 });

  return Response.json({ revalidated: true, tags });
}
