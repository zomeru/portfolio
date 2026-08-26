import assert from "node:assert/strict";
import test from "node:test";

import { createEmailSubscriptionService } from "./subscriptions";

type SubscriptionStatus = "pending" | "confirmed";

type FakeSubscription = {
  id: string;
  email: string;
  status: SubscriptionStatus;
  tokenHash: string | null;
  expiresAt: Date | null;
};

function createHarness(ttlHours = 24) {
  let now = new Date("2026-08-26T00:00:00.000Z");
  let nextToken = 1;
  let subscription: FakeSubscription | null = null;
  const sentTokens: string[] = [];
  const hashToken = (token: string) => `sha256:${token}`;

  const service = createEmailSubscriptionService({
    getConfiguration: () => ({
      confirmationTtlHours: ttlHours,
      emailConfigured: true,
      siteUrl: "https://example.com",
    }),
    createToken: () => `confirmation-token-${nextToken++}`,
    hashToken,
    createOrReuse: async (options) => {
      if (subscription?.status === "confirmed") {
        return { subscription, outcome: "already_subscribed" as const };
      }
      subscription = {
        id: subscription?.id ?? "subscription-1",
        email: options.email,
        status: "pending",
        tokenHash: options.verificationTokenHash,
        expiresAt: options.verificationExpiresAt,
      };
      return { subscription, outcome: "confirmation_required" as const };
    },
    confirm: async (tokenHash, confirmationTime) => {
      if (
        !subscription ||
        subscription.status !== "pending" ||
        subscription.tokenHash !== tokenHash ||
        !subscription.expiresAt ||
        subscription.expiresAt < confirmationTime
      ) {
        return null;
      }
      subscription.status = "confirmed";
      subscription.tokenHash = null;
      subscription.expiresAt = null;
      return { id: subscription.id };
    },
    expireToken: async (subscriptionId, tokenHash) => {
      if (subscription?.id === subscriptionId && subscription.tokenHash === tokenHash) {
        subscription.expiresAt = now;
      }
    },
    sendConfirmation: async (options) => {
      const token = new URL(options.confirmationUrl).searchParams.get("token");
      assert.ok(token);
      assert.equal(options.expiresInHours, ttlHours);
      sentTokens.push(token);
    },
    now: () => now,
  });

  return {
    service,
    sentTokens,
    getSubscription: () => subscription,
    advanceTime: (milliseconds: number) => {
      now = new Date(now.getTime() + milliseconds);
    },
  };
}

void test("successfully confirms a pending subscription and invalidates its hashed token", async () => {
  const harness = createHarness();
  const result = await harness.service.subscribe("person@example.com");
  const token = harness.sentTokens[0];
  assert.ok(token);
  assert.equal(result.outcome, "confirmation_required");
  assert.equal(harness.getSubscription()?.status, "pending");
  assert.notEqual(harness.getSubscription()?.tokenHash, token);

  assert.ok(await harness.service.confirm(token));
  assert.equal(harness.getSubscription()?.status, "confirmed");
  assert.equal(harness.getSubscription()?.tokenHash, null);
});

void test("rejects an expired confirmation token", async () => {
  const harness = createHarness(2);
  await harness.service.subscribe("person@example.com");
  const token = harness.sentTokens[0];
  assert.ok(token);
  harness.advanceTime(2 * 60 * 60 * 1_000 + 1);

  assert.equal(await harness.service.confirm(token), null);
  assert.equal(harness.getSubscription()?.status, "pending");
});

void test("rejects a reused confirmation token", async () => {
  const harness = createHarness();
  await harness.service.subscribe("person@example.com");
  const token = harness.sentTokens[0];
  assert.ok(token);

  assert.ok(await harness.service.confirm(token));
  assert.equal(await harness.service.confirm(token), null);
});

void test("ignores duplicate confirmed subscriptions", async () => {
  const harness = createHarness();
  await harness.service.subscribe("person@example.com");
  const token = harness.sentTokens[0];
  assert.ok(token);
  await harness.service.confirm(token);

  const duplicate = await harness.service.subscribe("person@example.com");
  assert.equal(duplicate.outcome, "already_subscribed");
  assert.equal(harness.sentTokens.length, 1);
});

void test("resends pending confirmation with a new single-use token", async () => {
  const harness = createHarness();
  await harness.service.subscribe("person@example.com");
  const firstToken = harness.sentTokens[0];
  const resend = await harness.service.subscribe("person@example.com");
  const secondToken = harness.sentTokens[1];
  assert.ok(firstToken);
  assert.ok(secondToken);

  assert.equal(resend.outcome, "confirmation_required");
  assert.notEqual(firstToken, secondToken);
  assert.equal(await harness.service.confirm(firstToken), null);
  assert.ok(await harness.service.confirm(secondToken));
});
