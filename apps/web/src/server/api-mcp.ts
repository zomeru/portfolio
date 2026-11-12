import "@tanstack/react-start/server-only";
import { createPortfolioMcpHandler } from "@/lib/mcp/portfolio";

let handler: ReturnType<typeof createPortfolioMcpHandler> | undefined;

function handle(request: Request) {
  handler ??= createPortfolioMcpHandler();
  return handler(request);
}

export { handle as GET, handle as POST, handle as DELETE };
