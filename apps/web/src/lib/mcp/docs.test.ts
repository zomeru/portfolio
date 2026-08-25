import assert from "node:assert/strict";
import test from "node:test";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { createDocsMcpHandler } from "./docs";

test("a real Streamable HTTP MCP client discovers and executes every documentation tool", async () => {
  const handler = createDocsMcpHandler(new URL("https://portfolio.example"));
  const transport = new StreamableHTTPClientTransport(new URL("http://localhost/api/mcp/docs"), {
    fetch: async (input, init) => handler(new Request(input, init)),
  });
  const client = new Client({ name: "portfolio-docs-contract-test", version: "1.0.0" });

  await client.connect(transport);
  try {
    const listed = await client.listTools();
    const expectedNames = ["get_api_overview", "get_authentication_guide", "get_openapi_spec"];
    assert.deepEqual(listed.tools.map(({ name }) => name).sort(), expectedNames.sort());

    for (const tool of listed.tools) {
      assert.equal(tool.annotations?.readOnlyHint, true, tool.name);
      assert.equal(tool.annotations?.destructiveHint, false, tool.name);
      assert.equal(tool.annotations?.idempotentHint, true, tool.name);
      assert.equal(tool.annotations?.openWorldHint, false, tool.name);
      assert.ok(tool.outputSchema, tool.name);
    }

    const overview = await client.callTool({ name: "get_api_overview", arguments: {} });
    assert.notEqual(overview.isError, true);
    assert.match((overview.structuredContent as { markdown: string }).markdown, /\/api\/mcp\/docs/);

    const authentication = await client.callTool({
      name: "get_authentication_guide",
      arguments: {},
    });
    assert.notEqual(authentication.isError, true);
    assert.match(
      (authentication.structuredContent as { markdown: string }).markdown,
      /Authentication: none/,
    );

    const openApi = await client.callTool({ name: "get_openapi_spec", arguments: {} });
    assert.notEqual(openApi.isError, true);
    assert.equal(
      (openApi.structuredContent as { document: { openapi: string } }).document.openapi,
      "3.2.0",
    );
  } finally {
    await client.close();
  }
});
