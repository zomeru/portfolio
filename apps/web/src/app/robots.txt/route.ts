import { siteUrl } from "@/lib/metadata";
import { publicText } from "@/lib/public-api-response";
import { getRobotsText } from "@/lib/robots";

export function GET() {
  return publicText(getRobotsText(new URL(siteUrl)), "text/plain; charset=utf-8");
}
