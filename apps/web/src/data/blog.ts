export type BlogPost = {
  title: string;
  date: string;
  description: string;
  tags: readonly string[];
  slug: string;
};

export const posts: readonly BlogPost[] = [
  {
    title: "Designing authentication for Cloudflare Workers",
    date: "2026-08-12",
    description:
      "A look at the trade-offs of building session-based authentication on the edge, and a practical pattern that works in production.",
    tags: ["Auth", "Cloudflare"],
    slug: "authentication-for-cloudflare-workers",
  },
  {
    title: "Moving a monorepo from Bun to pnpm",
    date: "2026-07-24",
    description:
      "Why we switched package managers, what broke, and how we kept CI fast with a strict lockfile and workspace tooling.",
    tags: ["Tooling", "Monorepos"],
    slug: "moving-a-monorepo-from-bun-to-pnpm",
  },
  {
    title: "Notes on building a personal portfolio",
    date: "2026-06-10",
    description:
      "Design principles and engineering decisions behind this site: typography, restraint, and the smallest useful stack.",
    tags: ["Design", "Engineering"],
    slug: "notes-on-building-a-personal-portfolio",
  },
];
