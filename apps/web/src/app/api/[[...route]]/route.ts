import { apiApp } from "@portfolio/api";
import { handle } from "hono/vercel";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const handler = handle(apiApp);

export {
  handler as DELETE,
  handler as GET,
  handler as OPTIONS,
  handler as PATCH,
  handler as POST,
  handler as PUT,
};
