import { createDocsMcpHandler } from "@/lib/mcp/docs";

const handler = createDocsMcpHandler();

export { handler as GET, handler as POST };
