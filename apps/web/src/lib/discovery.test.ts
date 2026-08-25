import assert from "node:assert/strict";
import test from "node:test";
import { GET as getAgentSkills } from "@/app/.well-known/agent-skills/index.json/route";
import { GET as getApiCatalog, HEAD as headApiCatalog } from "@/app/.well-known/api-catalog/route";
import { GET as getDocsMcpCard } from "@/app/.well-known/mcp/docs-server-card.json/route";
import { GET as getMcpCard } from "@/app/.well-known/mcp/server-card.json/route";
import { GET as getAuthenticationMarkdown } from "@/app/auth.md/route";
import { GET as getDeveloperLlms } from "@/app/developers/llms.txt/route";
import { GET as getDeveloperMarkdown } from "@/app/developers.md/route";
import { GET as getOpenApi } from "@/app/openapi.json/route";

test("machine-readable discovery routes expose canonical content types and links", async () => {
  const openApi = getOpenApi();
  assert.equal(openApi.status, 200);
  assert.match(openApi.headers.get("content-type") ?? "", /application\/vnd\.oai\.openapi\+json/);
  assert.equal((await openApi.json()).openapi, "3.2.0");

  const catalog = getApiCatalog();
  assert.match(catalog.headers.get("content-type") ?? "", /application\/linkset\+json/);
  assert.match(catalog.headers.get("link") ?? "", /openapi\.json/);
  assert.match(JSON.stringify(await catalog.json()), /docs-server-card\.json/);

  const catalogHead = headApiCatalog();
  assert.match(catalogHead.headers.get("content-type") ?? "", /application\/linkset\+json/);
  assert.match(catalogHead.headers.get("cache-control") ?? "", /s-maxage=3600/);
  assert.match(catalogHead.headers.get("link") ?? "", /api\/mcp\/docs/);

  const card = getMcpCard();
  assert.equal((await card.json()).transport, "streamable-http");

  const docsCard = getDocsMcpCard();
  const docsCardBody = await docsCard.json();
  assert.equal(docsCardBody.transport, "streamable-http");
  assert.equal(new URL(docsCardBody.serverUrl).pathname, "/api/mcp/docs");
  assert.equal(docsCardBody.tools.length, 3);

  const skills = getAgentSkills();
  const skillsBody = await skills.json();
  assert.ok(skillsBody.skills.length >= 9);
  assert.ok(
    skillsBody.skills.some(
      ({ endpoint }: { endpoint: string }) => new URL(endpoint).pathname === "/api/mcp/docs",
    ),
  );

  const llms = getDeveloperLlms();
  assert.match(llms.headers.get("content-type") ?? "", /text\/plain/);
  const llmsText = await llms.text();
  assert.match(llmsText, /\/api\/mcp\/docs/);
  assert.match(llmsText, /docs-server-card\.json/);

  const developerMarkdown = getDeveloperMarkdown();
  const guide = await developerMarkdown.text();
  assert.match(guide, /get_api_overview/);
  assert.match(guide, /docs-server-card\.json/);
  assert.match(guide, /### pnpm \(default\)/);
  assert.match(guide, /pnpm dlx @modelcontextprotocol\/inspector/);
  assert.match(guide, /npx @modelcontextprotocol\/inspector/);
  assert.match(guide, /bunx @modelcontextprotocol\/inspector/);
  assert.match(guide, /yarn dlx @modelcontextprotocol\/inspector/);

  const authentication = getAuthenticationMarkdown();
  assert.match(authentication.headers.get("cache-control") ?? "", /s-maxage=3600/);
  assert.match(await authentication.text(), /SHOULD NOT send/);
});
