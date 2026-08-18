export type Experience = {
  role: string;
  company: string;
  period: string;
  tech: readonly string[];
};

export const experience: readonly Experience[] = [
  {
    role: "Software Engineer",
    company: "Company Name",
    period: "2024 — Present",
    tech: ["React", "Django", "PostgreSQL", "Celery"],
  },
  {
    role: "Full-Stack Developer",
    company: "Company Name",
    period: "2023",
    tech: ["Next.js", "Node.js", "PostgreSQL", "Docker"],
  },
  {
    role: "Software Developer",
    company: "Company Name",
    period: "2022",
    tech: ["JavaScript", "Express", "MySQL", "Redis"],
  },
];
