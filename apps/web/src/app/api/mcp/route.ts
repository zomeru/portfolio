import { createPortfolioMcpHandler } from "@/lib/mcp/portfolio";

const handler = createPortfolioMcpHandler();

export { handler as GET, handler as POST };
