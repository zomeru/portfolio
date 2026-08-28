import { Resolver } from "node:dns/promises";

import { disposableEmailBlocklistSet } from "disposable-email-domains-js";
import { z } from "zod";

const emailSchema = z.email().max(320);
const disposableDomains = disposableEmailBlocklistSet();
const DEFAULT_MX_CACHE_TTL_MS = 10 * 60 * 1_000;
const DEFAULT_MX_CACHE_SIZE = 500;
const mxResolver = new Resolver({ timeout: 5_000, tries: 2 });

type MxRecord = {
  exchange: string;
  priority: number;
};

export type EmailValidationResult =
  | { success: true; email: string }
  | {
      success: false;
      reason: "invalid_format" | "disposable_domain" | "invalid_mx" | "dns_lookup_failed";
      retryable: boolean;
    };

export type EmailFormatValidationResult =
  | { success: true; email: string }
  | { success: false; reason: "invalid_format"; retryable: false };

type EmailValidatorDependencies = {
  resolveMx: (domain: string) => Promise<readonly MxRecord[]>;
  isDisposableDomain: (domain: string) => boolean;
  now: () => number;
  mxCacheTtlMs: number;
  mxCacheSize: number;
};

type MxCacheEntry = {
  expiresAt: number;
  valid: boolean;
};

export function normalizeEmail(email: string) {
  return email.trim().normalize("NFC").toLowerCase();
}

export function validateEmailFormat(input: string): EmailFormatValidationResult {
  const parsed = emailSchema.safeParse(normalizeEmail(input));
  return parsed.success
    ? { success: true, email: parsed.data }
    : { success: false, reason: "invalid_format", retryable: false };
}

function isDisposableDomainOrSubdomain(
  domain: string,
  isDisposableDomain: (candidate: string) => boolean,
) {
  const labels = domain.split(".");
  return labels.slice(0, -1).some((_, index) => isDisposableDomain(labels.slice(index).join(".")));
}

function hasValidMxRecord(records: readonly MxRecord[]) {
  return records.some(
    (record) =>
      Number.isInteger(record.priority) &&
      record.priority >= 0 &&
      record.exchange.trim() !== "" &&
      record.exchange !== ".",
  );
}

function cacheMxResult(
  cache: Map<string, MxCacheEntry>,
  domain: string,
  entry: MxCacheEntry,
  maximumSize: number,
) {
  if (cache.size >= maximumSize && !cache.has(domain)) {
    const oldestDomain = cache.keys().next().value;
    if (oldestDomain) cache.delete(oldestDomain);
  }
  cache.set(domain, entry);
}

export function createEmailValidator(dependencies: Partial<EmailValidatorDependencies> = {}) {
  const lookupMx = dependencies.resolveMx ?? ((domain: string) => mxResolver.resolveMx(domain));
  const isDisposableDomain =
    dependencies.isDisposableDomain ?? ((domain: string) => disposableDomains.has(domain));
  const now = dependencies.now ?? Date.now;
  const mxCacheTtlMs = dependencies.mxCacheTtlMs ?? DEFAULT_MX_CACHE_TTL_MS;
  const mxCacheSize = dependencies.mxCacheSize ?? DEFAULT_MX_CACHE_SIZE;
  const mxCache = new Map<string, MxCacheEntry>();

  return async (input: string): Promise<EmailValidationResult> => {
    const parsed = validateEmailFormat(input);
    if (!parsed.success) return parsed;

    const domain = parsed.email.slice(parsed.email.lastIndexOf("@") + 1);
    if (isDisposableDomainOrSubdomain(domain, isDisposableDomain)) {
      return { success: false, reason: "disposable_domain", retryable: false };
    }

    const cached = mxCache.get(domain);
    if (cached && cached.expiresAt > now()) {
      return cached.valid
        ? { success: true, email: parsed.email }
        : { success: false, reason: "invalid_mx", retryable: false };
    }
    if (cached) mxCache.delete(domain);

    try {
      const valid = hasValidMxRecord(await lookupMx(domain));
      cacheMxResult(mxCache, domain, { valid, expiresAt: now() + mxCacheTtlMs }, mxCacheSize);
      return valid
        ? { success: true, email: parsed.email }
        : { success: false, reason: "invalid_mx", retryable: false };
    } catch {
      return { success: false, reason: "dns_lookup_failed", retryable: true };
    }
  };
}

export const validateEmailAddress = createEmailValidator();
