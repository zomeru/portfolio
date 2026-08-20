import "server-only";

import { getSanityEnv } from "@portfolio/env/sanity";
import { getSanityServerEnv } from "@portfolio/env/sanity-server";
import { createClient } from "next-sanity";

const sanityEnv = getSanityEnv();
const sanityServerEnv = getSanityServerEnv();

export const sanityClient = createClient({
  projectId: sanityEnv.projectId,
  dataset: sanityEnv.dataset,
  apiVersion: "2026-08-20",
  useCdn: process.env.NODE_ENV === "production",
  perspective: "published",
  token: sanityServerEnv.token,
});
