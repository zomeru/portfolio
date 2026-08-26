import assert from "node:assert/strict";
import test from "node:test";

import { createEmailValidator, normalizeEmail } from "./email-validation";

void test("normalizes and validates an email with MX records", async () => {
  const domains: string[] = [];
  const validate = createEmailValidator({
    resolveMx: async (domain) => {
      domains.push(domain);
      return [{ exchange: "mail.example.com", priority: 10 }];
    },
    isDisposableDomain: () => false,
  });

  assert.equal(normalizeEmail("  A\u030A@EXAMPLE.COM  "), "å@example.com");
  assert.deepEqual(await validate("  USER@Example.COM  "), {
    success: true,
    email: "user@example.com",
  });
  assert.deepEqual(domains, ["example.com"]);
});

void test("rejects an invalid email format before domain checks", async () => {
  let mxLookups = 0;
  const validate = createEmailValidator({
    resolveMx: async () => {
      mxLookups += 1;
      return [];
    },
    isDisposableDomain: () => false,
  });

  assert.deepEqual(await validate("not-an-email"), {
    success: false,
    reason: "invalid_format",
    retryable: false,
  });
  assert.equal(mxLookups, 0);
});

void test("rejects disposable email domains before MX lookup", async () => {
  let mxLookups = 0;
  const validate = createEmailValidator({
    resolveMx: async () => {
      mxLookups += 1;
      return [{ exchange: "mail.mailinator.com", priority: 10 }];
    },
  });

  assert.deepEqual(await validate("person@mailinator.com"), {
    success: false,
    reason: "disposable_domain",
    retryable: false,
  });
  assert.equal(mxLookups, 0);
});

void test("rejects domains without usable MX records", async () => {
  const validate = createEmailValidator({
    resolveMx: async () => [],
    isDisposableDomain: () => false,
  });
  const validateNullMx = createEmailValidator({
    resolveMx: async () => [{ exchange: ".", priority: 0 }],
    isDisposableDomain: () => false,
  });

  const expected = { success: false, reason: "invalid_mx", retryable: false } as const;
  assert.deepEqual(await validate("person@example.invalid"), expected);
  assert.deepEqual(await validateNullMx("person@example.com"), expected);
});

void test("returns a retryable result when DNS lookup fails", async () => {
  const validate = createEmailValidator({
    resolveMx: async () => {
      throw Object.assign(new Error("query timed out"), { code: "ETIMEOUT" });
    },
    isDisposableDomain: () => false,
  });

  assert.deepEqual(await validate("person@example.com"), {
    success: false,
    reason: "dns_lookup_failed",
    retryable: true,
  });
});

void test("caches MX results by normalized domain", async () => {
  let mxLookups = 0;
  const validate = createEmailValidator({
    resolveMx: async () => {
      mxLookups += 1;
      return [{ exchange: "mail.example.com", priority: 10 }];
    },
    isDisposableDomain: () => false,
  });

  await validate("first@example.com");
  await validate("second@EXAMPLE.COM");
  assert.equal(mxLookups, 1);
});
