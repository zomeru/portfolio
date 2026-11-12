import type { ReactNode } from "react";
import { IntlProvider, useTranslations } from "use-intl";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteNav } from "@/components/layout/site-nav";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { ThemeProvider } from "@/components/theme/theme-provider";
import type { getMessages } from "@/i18n/messages";
import { localizedPath, type Locale } from "@/i18n/routing";
import type { getSiteData } from "@/lib/site.functions";

type SiteShellProps = Awaited<ReturnType<typeof getSiteData>> & {
  children: ReactNode;
  admin?: boolean;
  locale: Locale;
  messages: Awaited<ReturnType<typeof getMessages>>;
};

export function SiteShell({ children, admin, locale, messages, ...site }: SiteShellProps) {
  return (
    <IntlProvider locale={locale} messages={messages} timeZone="UTC">
      <ThemeProvider>
        <ServiceWorkerRegistration />
        <SiteContent admin={admin === true} locale={locale} {...site}>
          {children}
        </SiteContent>
      </ThemeProvider>
    </IntlProvider>
  );
}

function SiteContent({
  children,
  admin,
  locale,
  profile,
  techStack,
}: Omit<SiteShellProps, "messages">) {
  const t = useTranslations("Common");
  const searchEndpoint = localizedPath("/search-index.json", locale);
  return (
    <>
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-50 rounded-sm bg-foreground px-4 py-2 text-sm font-medium text-background focus:not-sr-only"
      >
        {t("skipToContent")}
      </a>
      <div className="flex min-h-dvh flex-col">
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 sm:px-8">
          <SiteHeader
            profile={profile}
            techStack={techStack}
            showLanguagePicker={!admin}
            {...(admin ? {} : { searchEndpoint })}
          />
          <SiteNav showLanguagePicker={!admin} {...(admin ? {} : { searchEndpoint })} />
          <main
            id="main-content"
            tabIndex={-1}
            className={`flex-1 scroll-mt-4 py-12 sm:py-16${admin ? "" : " overflow-y-hidden"}`}
          >
            {children}
          </main>
          <SiteFooter profile={profile} />
        </div>
      </div>
    </>
  );
}
