import { cache } from "react";

import { sanityFetch } from "../fetch";
import { TECH_STACK_QUERY } from "../queries";

export const getTechStack = cache(() =>
  sanityFetch({ query: TECH_STACK_QUERY, tags: ["techStack"] }),
);
