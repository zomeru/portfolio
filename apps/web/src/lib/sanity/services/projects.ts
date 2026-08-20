import { cache } from "react";

import { sanityFetch } from "../fetch";
import { PROJECTS_QUERY } from "../queries";

export const getProjects = cache(() => sanityFetch({ query: PROJECTS_QUERY, tags: ["project"] }));
