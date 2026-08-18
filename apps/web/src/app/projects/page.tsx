import type { Metadata } from "next";

import { PageHeader } from "@/components/portfolio/page-header";
import { ProjectItem } from "@/components/portfolio/project-item";
import { projects } from "@/data/projects";

export const metadata: Metadata = {
  title: "Projects",
  description: "Selected work.",
};

export default function ProjectsPage() {
  return (
    <>
      <PageHeader index="02" eyebrow="Projects" title="Selected work." />
      <ul className="mt-10 divide-y divide-border border-t border-border">
        {projects.map((project, index) => (
          <li key={project.title}>
            <ProjectItem project={project} index={index + 1} />
          </li>
        ))}
      </ul>
    </>
  );
}
