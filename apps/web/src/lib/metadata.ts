import "server-only";

import { env } from "@portfolio/env";
import type { Metadata } from "next";

export const siteUrl = env.NEXT_PUBLIC_SITE_URL;

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
};

export function createPageMetadata({ title, description, path }: PageMetadataOptions): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      type: "website",
      url: new URL(path, siteUrl),
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}
