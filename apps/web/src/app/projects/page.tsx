import type { Metadata } from "next";

import { PageHeader } from "@/components/portfolio/page-header";
import { ProjectItem } from "@/components/portfolio/project-item";
import { getProjects } from "@/lib/sanity/services/projects";

export const metadata: Metadata = {
  title: "Projects",
  description: "Selected work.",
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <>
      <PageHeader index="02" eyebrow="Projects" title="Selected work." />
      <ul className="mt-10 divide-y divide-border border-t border-border">
        {projects.map((project, index) => (
          <li key={project._id}>
            <ProjectItem project={project} index={index + 1} />
          </li>
        ))}
        {projects.length === 0 && (
          <li className="py-10 text-sm text-muted">No projects are published yet.</li>
        )}
      </ul>
    </>
  );
}
