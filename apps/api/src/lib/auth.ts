import { getCronEnv } from "@portfolio/env/cron";

import { ApiError } from "../errors";
import { constantTimeEqual } from "./secure-compare";

export function requireCronAuthorization(authorization: string | undefined) {
  const expected = `Bearer ${getCronEnv().secret}`;

  if (!authorization || !constantTimeEqual(authorization, expected)) {
    throw new ApiError("Unauthorized", { code: "UNAUTHORIZED", status: 401 });
  }
}
