export type Project = {
  title: string;
  year: string;
  description: string;
  tech: readonly string[];
  github?: string;
  live?: string;
  caseStudy?: string;
};

export const projects: readonly Project[] = [
  {
    title: "ZomLab",
    year: "2026",
    description:
      "Personal engineering laboratory for exploring modern full-stack architecture, edge deployment, and developer tooling.",
    tech: ["TanStack Start", "Hono", "PostgreSQL", "Cloudflare"],
    github: "https://github.com/zomeru/zomlab",
    live: "https://zomlab.dev",
  },
  {
    title: "Open Source Contributions",
    year: "2025",
    description:
      "Maintaining and contributing to open-source libraries and tooling across the JavaScript ecosystem.",
    tech: ["TypeScript", "Node.js", "Vitest", "GitHub Actions"],
    github: "https://github.com/zomeru",
  },
  {
    title: "Project Name",
    year: "2024",
    description: "Short description of the project, the problem it solves, and the impact it had.",
    tech: ["Next.js", "PostgreSQL", "TypeScript"],
    live: "https://example.com",
  },
];
