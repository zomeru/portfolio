import { apiApp } from "@portfolio/api";
import { handle } from "hono/vercel";

import { revalidateBlogGeneration } from "@/lib/blog-cache";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const handler = handle(apiApp);

export async function GET(request: Request) {
  const response = await handler(request);
  await revalidateBlogGeneration(request, response);
  return response;
}

export async function POST(request: Request) {
  const response = await handler(request);
  await revalidateBlogGeneration(request, response);
  return response;
}
