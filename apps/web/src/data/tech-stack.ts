export type TechStackCategory = {
  label: string;
  items: readonly string[];
};

export const techStack: readonly TechStackCategory[] = [
  {
    label: "Frontend",
    items: ["TypeScript", "React", "Next.js", "TanStack", "Tailwind CSS"],
  },
  {
    label: "Backend",
    items: ["Node.js", "Hono", "Express", "Django"],
  },
  {
    label: "Data",
    items: ["PostgreSQL", "Redis", "Drizzle", "Prisma"],
  },
  {
    label: "Infrastructure / Tools",
    items: ["Docker", "GitHub Actions", "Cloudflare", "Vercel"],
  },
];
