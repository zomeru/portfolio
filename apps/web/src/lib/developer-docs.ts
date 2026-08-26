import {
  DOCS_MCP_TOOLS,
  PORTFOLIO_MCP_TOOLS,
  PUBLIC_API_VERSION,
} from "@portfolio/api/public-portfolio";

const absoluteUrl = (path: string, siteUrl: URL) => new URL(path, siteUrl).href;

export function getAuthenticationGuideMarkdown(siteUrl: URL) {
  return `# Authentication policy

The versioned Zomer Gregorio Portfolio data API is public, anonymous, read-only, and limited to information already published on the portfolio. Separate same-origin notification endpoints accept only an email address or browser-generated PushSubscription after explicit opt-in.

- Authentication: none
- Credentials: clients SHOULD NOT send API keys, cookies, bearer tokens, or other credentials
- Portfolio data mutations: none
- Notification mutations: anonymous, validated, body-limited, rate-limited, and documented in OpenAPI
- Canonical API index: ${absoluteUrl("/api/v1", siteUrl)}

Private administration, webhook registration, draft content, AI indexing metadata, embeddings, provider configuration, and secrets are outside this public contract.
`;
}

export function getDeveloperGuideMarkdown(siteUrl: URL) {
  const origin = siteUrl.href.replace(/\/$/, "");
  const tools = PORTFOLIO_MCP_TOOLS.map((tool) => `- \`${tool.name}\` — ${tool.description}`).join(
    "\n",
  );
  const docsTools = DOCS_MCP_TOOLS.map((tool) => `- \`${tool.name}\` — ${tool.description}`).join(
    "\n",
  );
  const inspectorCommands = [
    `npx @modelcontextprotocol/inspector --server-url ${origin}/api/mcp --transport http`,
    `npx @modelcontextprotocol/inspector --cli --server-url ${origin}/api/mcp --transport http --method tools/list`,
  ].join("\n");

  return `# Zomer Gregorio Portfolio API

The Portfolio API gives agents and developers deterministic, structured access to Zomer Gregorio's published professional information without scraping HTML.

## Endpoints

| Service | URL |
| --- | --- |
| REST API index | [\`${origin}/api/v1\`](${origin}/api/v1) |
| OpenAPI 3.2 | [\`${origin}/openapi.json\`](${origin}/openapi.json) |
| Portfolio MCP | [\`${origin}/api/mcp\`](${origin}/api/mcp) |
| Documentation MCP | [\`${origin}/api/mcp/docs\`](${origin}/api/mcp/docs) |
| API catalog | [\`${origin}/.well-known/api-catalog\`](${origin}/.well-known/api-catalog) |
| Portfolio MCP server card | [\`${origin}/.well-known/mcp/server-card.json\`](${origin}/.well-known/mcp/server-card.json) |
| Documentation MCP server card | [\`${origin}/.well-known/mcp/docs-server-card.json\`](${origin}/.well-known/mcp/docs-server-card.json) |
| Agent capabilities | [\`${origin}/.well-known/agent-skills/index.json\`](${origin}/.well-known/agent-skills/index.json) |

The REST contract is version ${PUBLIC_API_VERSION}. Breaking REST changes will use a new URL version such as \`/api/v2\`; non-breaking additions may remain in \`/api/v1\`.

## REST resources

| Resource | Method | Endpoint |
| --- | --- | --- |
| API index | GET | \`/api/v1\` |
| Profile | GET | \`/api/v1/profile\` |
| Resume | GET | \`/api/v1/resume\` |
| Experience | GET | \`/api/v1/experience\` |
| Projects | GET | \`/api/v1/projects\` |
| Blogs | GET | \`/api/v1/blogs?limit=10&offset=0\` |
| Blog | GET | \`/api/v1/blogs/{slug}\` |
| Tech stack | GET | \`/api/v1/tech-stack\` |

All versioned portfolio REST resources support anonymous cross-origin reads and return cacheable JSON sourced from published Sanity content. The same-origin notification endpoints in OpenAPI are opt-in mutations and always return \`Cache-Control: no-store\`.

## REST examples

\`\`\`bash
curl ${origin}/api/v1
curl ${origin}/api/v1/profile
curl '${origin}/api/v1/blogs?limit=5&offset=0'
curl ${origin}/api/v1/resume
\`\`\`

## MCP

Connect a Streamable HTTP MCP client to:

\`\`\`text
${origin}/api/mcp
\`\`\`

Available portfolio tools:

${tools}

The documentation MCP at ${origin}/api/mcp/docs exposes:

${docsTools}

Example client configuration:

\`\`\`json
{
  "mcpServers": {
    "zomer-portfolio": {
      "url": "${origin}/api/mcp"
    },
    "zomer-portfolio-docs": {
      "url": "${origin}/api/mcp/docs"
    }
  }
}
\`\`\`

The Inspector commands below target the portfolio MCP. Replace \`${origin}/api/mcp\` with \`${origin}/api/mcp/docs\` to inspect the documentation MCP.

## Current MCP Inspector commands

\`\`\`bash
${inspectorCommands}
\`\`\`

## Authentication and safety

Authentication is \`none\` for published data and public email/push opt-in. Clients SHOULD NOT send credentials to those routes. The versioned portfolio operations are read-only; notification mutations accept only delivery data and never expose subscription lists. Webhook registration and notification summaries are private admin capabilities.

## Caching and freshness

Responses use public HTTP caching and the existing five-minute Sanity revalidation window. Newly published content should appear reasonably quickly without creating a second cache architecture.

## Outgoing blog webhooks

The portfolio can send a versioned HTTPS request after a blog is successfully published. Only the
\`blog.published\` event is available. Webhook registration is admin-approved: send the endpoint URL,
integration name, and destination type through [the contact page](${origin}/contact). The portfolio
owner then registers it through the webhook controls on \`/admin\` or the protected
\`POST /api/notifications/webhooks\` route. This avoids an unauthenticated arbitrary-URL relay.

Portfolio-owner registration request (the bearer value is the existing blog-generation admin
capability, never a developer-supplied credential):

\`\`\`bash
curl -X POST ${origin}/api/notifications/webhooks -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" --data '{"name":"Example integration","url":"https://example.com/hooks/zomer","destinationType":"generic","events":["blog.published"]}'
\`\`\`

The same protected API lists non-sensitive summaries with
\`GET /api/notifications/webhooks\` and disables one with
\`DELETE /api/notifications/webhooks/{id}\`. The admin page can send a direct connectivity test with
\`POST /api/notifications/webhooks/{id}/test\`; tests are not persisted as publication events and are
not retried. Generic test requests use the signed \`webhook.test\` event type, while Slack and Discord
receive a clearly labeled test message.

Generic destinations receive the following JSON contract:

\`\`\`json
{
  "id": "evt_...",
  "type": "blog.published",
  "apiVersion": "1",
  "createdAt": "2026-08-25T07:00:00.000Z",
  "data": {
    "blog": {
      "id": "sanity-document-id",
      "revision": "sanity-revision",
      "title": "Post title",
      "slug": "post-title",
      "excerpt": "Short description",
      "publishedAt": "2026-08-25T07:00:00.000Z",
      "url": "${origin}/blogs/post-title"
    }
  }
}
\`\`\`

The registration response returns the generic signing secret once. Store it in a secret manager.
The destination URL and signing secret are encrypted at rest; neither is exposed by list or admin
summary responses. Each generic request includes:

| Header | Value |
| --- | --- |
| \`X-Portfolio-Event\` | \`blog.published\` |
| \`X-Portfolio-Delivery\` | Stable per-destination delivery UUID |
| \`X-Portfolio-Timestamp\` | Unix timestamp in seconds |
| \`X-Portfolio-Signature\` | \`v1=\` plus HMAC-SHA256 of \`timestamp.rawBody\` |
| \`X-Webhook-Version\` | \`1\` |

Verify the exact raw request body before parsing JSON and reject timestamps older than five minutes:

\`\`\`ts
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

function constantTimeEqual(actual: string, expected: string) {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(actual), digest(expected));
}

function signWebhookPayload(secret: string, timestamp: string, rawBody: string) {
  return createHmac("sha256", secret).update(timestamp + "." + rawBody).digest("hex");
}

export function verifyWebhookSignature(options: {
  rawBody: string;
  timestamp: string;
  signature: string;
  secret: string;
  toleranceSeconds?: number;
  now?: Date;
}) {
  const timestampSeconds = Number(options.timestamp);
  if (!Number.isSafeInteger(timestampSeconds)) return false;
  const nowSeconds = Math.floor((options.now ?? new Date()).getTime() / 1_000);
  if (Math.abs(nowSeconds - timestampSeconds) > (options.toleranceSeconds ?? 300)) return false;
  const expected =
    "v1=" + signWebhookPayload(options.secret, options.timestamp, options.rawBody);
  return constantTimeEqual(options.signature, expected);
}
\`\`\`

Return any \`2xx\` status after durably accepting a request. Timeouts, \`408\`, \`425\`, \`429\`,
and \`5xx\` responses become eligible for retry after 1 minute, 5 minutes, 30 minutes, and 2 hours,
with at most five attempts total. The portfolio owner starts queued retries from the protected admin
page; the retry endpoint is not public or scheduled. Other \`4xx\` responses fail permanently.
Consumers must use
\`X-Portfolio-Delivery\` or the event ID as an idempotency key because a network failure can cause a
successful request to be delivered again.

Choose \`slack\` or \`discord\` during registration for platform-specific message payloads. Slack
destinations are restricted to official incoming-webhook hosts. Discord destinations are restricted
to official webhook URLs and use \`wait=true\` so a successful response confirms acceptance. These
adapters do not receive the generic signature headers because their URL credentials are the platform
authentication mechanism.

For local testing, expose an HTTPS handler with a tunnel such as Cloudflare Tunnel or ngrok, request
admin approval for the temporary public URL, preserve the raw body in the handler, and publish only to
an explicitly selected development Sanity dataset. Localhost and private/link-local IP targets are
rejected by design.
`;
}

export function getDeveloperLlmsText(siteUrl: URL) {
  const origin = siteUrl.href.replace(/\/$/, "");
  return `# Zomer Gregorio Portfolio Developer Resources

> Public, anonymous, read-only machine interfaces for verified portfolio data.

- API index: ${origin}/api/v1
- OpenAPI 3.2: ${origin}/openapi.json
- MCP Streamable HTTP: ${origin}/api/mcp
- Documentation MCP: ${origin}/api/mcp/docs
- Developer guide: ${origin}/developers.md
- Outgoing blog webhook guide: ${origin}/developers.md#outgoing-blog-webhooks
- Authentication policy: ${origin}/auth.md
- RFC 9727 API catalog: ${origin}/.well-known/api-catalog
- Portfolio MCP server card: ${origin}/.well-known/mcp/server-card.json
- Documentation MCP server card: ${origin}/.well-known/mcp/docs-server-card.json
- Agent skills: ${origin}/.well-known/agent-skills/index.json
`;
}
