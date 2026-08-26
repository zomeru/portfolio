import "server-only";
import { getSiteEnv } from "@portfolio/env/site";
import type { Metadata } from "next";

export const siteUrl = getSiteEnv().siteUrl;
export const domain = siteUrl.replace(/^https?:\/\//, "");
export const siteUpdatedAt = new Date("2026-08-25");

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
      locale: "en_US",
      siteName: "Zomer Gregorio",
      type: "website",
      url: new URL(path, siteUrl),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
