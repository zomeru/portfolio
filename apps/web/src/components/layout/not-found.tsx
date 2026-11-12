import { Link as RouterLink } from "@tanstack/react-router";
import { useTranslations } from "use-intl";

import { Link } from "@/i18n/navigation";

import en from "../../../messages/en/errors.json";

export function DefaultNotFound() {
  return <NotFoundContent copy={en.notFound} localized={false} />;
}

export function LocalizedNotFound() {
  const t = useTranslations("Errors.notFound");
  return (
    <NotFoundContent
      copy={{
        eyebrow: t("eyebrow"),
        title: t("title"),
        description: t("description"),
        action: t("action"),
      }}
      localized
    />
  );
}

function NotFoundContent({ copy, localized }: { copy: typeof en.notFound; localized: boolean }) {
  const className =
    "mt-6 inline-flex min-h-11 items-center rounded-sm bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity duration-200 hover:opacity-80 motion-reduce:transition-none";
  return (
    <section
      aria-labelledby="not-found-heading"
      className={localized ? "max-w-xl" : "mx-auto max-w-xl px-5 py-12"}
    >
      <meta name="robots" content="noindex, nofollow" />
      <p className="font-mono text-xs uppercase tracking-widest text-muted">{copy.eyebrow}</p>
      <h1 id="not-found-heading" className="mt-3 text-2xl font-medium tracking-tight">
        {copy.title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">{copy.description}</p>
      {localized ? (
        <Link href="/" className={className}>
          {copy.action}
        </Link>
      ) : (
        <RouterLink to="/{-$locale}" className={className}>
          {copy.action}
        </RouterLink>
      )}
    </section>
  );
}
