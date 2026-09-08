# Portfolio

Personal portfolio with a technical blog, GitHub activity, and Ask Zomer AI chat. Sanity is the published content source; PostgreSQL supports grounded retrieval and chat persistence.

## Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS
- **API:** Hono
- **Content:** Sanity, GROQ
- **Data:** PostgreSQL, Drizzle ORM, pgvector
- **AI:** AI SDK, Gemini, Groq / NVIDIA NIM / OpenRouter
- **Tooling:** TypeScript, Turborepo, pnpm

## Core Features

- Portfolio, projects, experience, and blog backed by Sanity
- Ask Zomer AI chat grounded in indexed portfolio content
- AI-assisted blog generation and publishing
- GitHub activity and contributions
- Email, Web Push, and webhook notifications for new posts
- Public REST API, OpenAPI contract, and MCP servers
- Admin dashboard for publishing, reindexing, and delivery retries

## Development

```sh
cp .env.example .env.local
pnpm install
pnpm dev
```

| Command          | Purpose                   |
| ---------------- | ------------------------- |
| `pnpm dev`       | Start the web app         |
| `pnpm build`     | Build the web app         |
| `pnpm lint`      | Check formatting and lint |
| `pnpm test`      | Run API tests             |
| `pnpm check:all` | Run all checks and tests  |
