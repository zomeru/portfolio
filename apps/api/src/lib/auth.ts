import { getCronEnv } from "@portfolio/env/cron";

import { ApiError } from "../errors";
import { constantTimeEqual } from "./secure-compare";

export function requireCronAuthorization(authorization: string | undefined) {
  if (!authorization || !constantTimeEqual(authorization, `Bearer ${getCronEnv().secret}`)) {
    throw new ApiError("Unauthorized", { code: "UNAUTHORIZED", status: 401 });
  }
}
