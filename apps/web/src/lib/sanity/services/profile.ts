import { cache } from "react";

import { sanityFetch } from "../fetch";
import { PROFILE_QUERY } from "../queries";

export const getProfile = cache(() => sanityFetch({ query: PROFILE_QUERY, tags: ["profile"] }));
