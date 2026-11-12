import {
  defaultParseSearch,
  Link as RouterLink,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { useLocale } from "use-intl";

import { isLocale, localizedPath } from "./routing";

export function usePathname() {
  return useLocation({
    select: ({ pathname }) => {
      const segment = pathname.split("/")[1];
      return segment && isLocale(segment) ? pathname.slice(segment.length + 1) || "/" : pathname;
    },
  });
}

function linkOptions(href: string, locale: ReturnType<typeof useLocale>) {
  const url = new URL(href, "https://portfolio.invalid");
  return {
    to: localizedPath(url.pathname, locale),
    search: defaultParseSearch(url.search),
    hash: url.hash.slice(1),
  };
}

export function Link({
  href,
  ...props
}: Pick<
  ComponentProps<"a">,
  "children" | "className" | "aria-label" | "aria-current" | "title" | "onClick"
> & { href: string }) {
  const locale = useLocale();
  return <RouterLink {...linkOptions(href, locale)} {...props} />;
}

export function useRouter() {
  const navigate = useNavigate();
  const locale = useLocale();
  return { push: (href: string) => navigate(linkOptions(href, locale)) };
}
