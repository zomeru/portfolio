import { getSearchIndex } from "@/features/search/lib/get-index";

export const revalidate = false;

export async function GET() {
  return Response.json(await getSearchIndex("en"));
}
