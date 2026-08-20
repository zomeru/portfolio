import { cache } from "react";

import { sanityFetch } from "../fetch";
import { EXPERIENCE_QUERY } from "../queries";

export const getExperience = cache(() =>
  sanityFetch({ query: EXPERIENCE_QUERY, tags: ["experience"] }),
);
