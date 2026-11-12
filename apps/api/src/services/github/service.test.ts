import assert from "node:assert/strict";
import test from "node:test";

import { getGithubCommits } from "./service";

void test("retries a dropped GitHub fetch once and preserves upstream rate limits", async (t) => {
  const originalToken = process.env.GH_PAT_TOKEN;
  process.env.GH_PAT_TOKEN = "github-test-token";
  t.after(() => {
    if (originalToken === undefined) delete process.env.GH_PAT_TOKEN;
    else process.env.GH_PAT_TOKEN = originalToken;
  });

  const searchPages: Array<string | null> = [];
  t.mock.method(globalThis, "fetch", async (input: string) => {
    const url = new URL(input);
    if (url.pathname === "/user") return Response.json({ login: "portfolio-test" });
    if (url.pathname === "/user/repos") return Response.json([]);
    assert.equal(url.pathname, "/search/commits");

    const page = url.searchParams.get("page");
    searchPages.push(page);
    if (page === "2") return new Response("Rate limited", { status: 429 });
    if (searchPages.length === 1) throw new Error("Simulated dropped connection");
    return Response.json({ incomplete_results: false, items: [], total_count: 0 });
  });

  assert.equal((await getGithubCommits({ page: 1, pageSize: 10 })).total, 0);
  await assert.rejects(getGithubCommits({ page: 2, pageSize: 10 }), {
    code: "GITHUB_RATE_LIMITED",
    status: 429,
  });
  assert.deepEqual(searchPages, ["1", "1", "2"]);
});
