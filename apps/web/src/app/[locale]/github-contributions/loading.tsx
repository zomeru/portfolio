import { useTranslations } from "next-intl";

import { PageHeader } from "@/components/portfolio/page-header";

export default function GithubContributionsLoading() {
  const t = useTranslations("Github");
  return (
    <div aria-busy="true">
      <PageHeader index="04" eyebrow={t("eyebrow")} title={t("title")} />
      <p role="status" className="mt-12 text-sm text-muted">
        {t("loading")}
      </p>
      <div className="mt-6 h-40 animate-pulse rounded-md bg-border/50 motion-reduce:animate-none" />
      <div className="mt-16 h-64 animate-pulse rounded-md bg-border/50 motion-reduce:animate-none" />
    </div>
  );
}
