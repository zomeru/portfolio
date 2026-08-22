import { createHash, timingSafeEqual } from "node:crypto";

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export function constantTimeEqual(actual: string, expected: string) {
  return timingSafeEqual(digest(actual), digest(expected));
}
