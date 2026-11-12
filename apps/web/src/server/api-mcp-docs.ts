import "@tanstack/react-start/server-only";
import { createDocsMcpHandler } from "@/lib/mcp/docs";

let handler: ReturnType<typeof createDocsMcpHandler> | undefined;

function handle(request: Request) {
  handler ??= createDocsMcpHandler();
  return handler(request);
}

export { handle as GET, handle as POST, handle as DELETE };
