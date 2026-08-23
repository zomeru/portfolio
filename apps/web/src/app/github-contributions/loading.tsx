import { PageHeader } from "@/components/portfolio/page-header";

export default function GithubContributionsLoading() {
  return (
    <div aria-busy="true">
      <PageHeader
        index="04"
        eyebrow="GitHub Contributions"
        title="Contribution activity and commits across repositories I own."
      />
      <p role="status" className="mt-12 text-sm text-muted">
        Loading GitHub activity…
      </p>
      <div className="mt-6 h-40 animate-pulse rounded-md bg-border/50 motion-reduce:animate-none" />
      <div className="mt-16 h-64 animate-pulse rounded-md bg-border/50 motion-reduce:animate-none" />
    </div>
  );
}
