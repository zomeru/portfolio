import assert from "node:assert/strict";
import test from "node:test";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { createTestPublicPortfolioService } from "@portfolio/api/public-portfolio/testing";
import { createPortfolioMcpHandler } from "./portfolio";

test("a real Streamable HTTP MCP client discovers and executes every portfolio tool", async () => {
  const handler = createPortfolioMcpHandler(createTestPublicPortfolioService());
  const transport = new StreamableHTTPClientTransport(new URL("http://localhost/api/mcp"), {
    fetch: async (input, init) => handler(new Request(input, init)),
  });
  const client = new Client({ name: "portfolio-contract-test", version: "1.0.0" });

  await client.connect(transport);
  try {
    const listed = await client.listTools();
    const expectedNames = [
      "get_profile",
      "get_resume",
      "get_tech_stack",
      "list_experience",
      "list_projects",
      "list_blog_posts",
      "get_blog_post",
    ];
    assert.deepEqual(listed.tools.map(({ name }) => name).sort(), expectedNames.sort());

    for (const tool of listed.tools) {
      assert.equal(tool.annotations?.readOnlyHint, true, tool.name);
      assert.equal(tool.annotations?.destructiveHint, false, tool.name);
      assert.equal(tool.annotations?.idempotentHint, true, tool.name);
      assert.equal(tool.annotations?.openWorldHint, false, tool.name);
      assert.ok(tool.outputSchema, tool.name);
    }

    const calls = [
      { name: "get_profile", arguments: {} },
      { name: "get_resume", arguments: {} },
      { name: "get_tech_stack", arguments: {} },
      { name: "list_experience", arguments: {} },
      { name: "list_projects", arguments: {} },
      { name: "list_blog_posts", arguments: { limit: 1, offset: 0 } },
      { name: "get_blog_post", arguments: { slug: "published-article" } },
    ];

    for (const call of calls) {
      const result = await client.callTool(call);
      assert.notEqual(result.isError, true, call.name);
      assert.ok(result.structuredContent, call.name);
      assert.equal(result.content[0]?.type, "text", call.name);
    }

    const defaultListResult = await client.callTool({
      name: "list_blog_posts",
      arguments: {},
    });
    assert.notEqual(defaultListResult.isError, true);
    assert.equal((defaultListResult.structuredContent as { total: number }).total, 1);

    const searchResult = await client.callTool({
      name: "list_blog_posts",
      arguments: { query: "PUBLISHED" },
    });
    assert.notEqual(searchResult.isError, true);
    assert.equal((searchResult.structuredContent as { total: number }).total, 1);

    const emptySearchResult = await client.callTool({
      name: "list_blog_posts",
      arguments: { query: "missing" },
    });
    assert.notEqual(emptySearchResult.isError, true);
    assert.equal((emptySearchResult.structuredContent as { total: number }).total, 0);
  } finally {
    await client.close();
  }
});
