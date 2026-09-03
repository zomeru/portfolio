import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { SearchItem } from "@/features/search/types/search";

import { buildOfflinePrompt, retrieveOfflineKnowledge } from "./knowledge";

const items: SearchItem[] = [
  {
    aliases: ["Batibot", "project"],
    description: "A learning platform for children.",
    group: "project",
    href: "/en/projects/batibot",
    id: "project:batibot",
    keywords: ["Next.js", "education", "TypeScript"],
    title: "Batibot",
  },
  {
    aliases: ["calendar"],
    description: "Toggle the calendar.",
    group: "action",
    id: "action:calendar",
    keywords: ["calendar"],
    title: "Calendar",
  },
  {
    aliases: ["職歴"],
    description: "ソフトウェア開発の経験と経歴。",
    group: "work",
    href: "/ja/work/example",
    id: "work:example",
    keywords: ["開発経験"],
    title: "職務経験",
  },
  {
    aliases: ["unsafe"],
    group: "project",
    href: "https://example.com/project",
    id: "project:unsafe",
    keywords: ["unsafe"],
    title: "Unsafe external project",
  },
];

void describe("offline knowledge retrieval", () => {
  void it("ranks public portfolio evidence and excludes actions", () => {
    const matches = retrieveOfflineKnowledge(
      "Which TypeScript education project did Zomer build?",
      items,
      "https://zomeru.dev",
    );
    assert.equal(matches.length, 1);
    assert.equal(matches[0]?.source.id, "project:batibot");
    assert.equal(matches[0]?.source.url, "https://zomeru.dev/en/projects/batibot");
  });

  void it("returns no evidence instead of broad unrelated context", () => {
    assert.deepEqual(
      retrieveOfflineKnowledge("What is the weather?", items, "https://zomeru.dev"),
      [],
    );
  });

  void it("retrieves CJK evidence and excludes cross-origin links", () => {
    const matches = retrieveOfflineKnowledge(
      "開発経験について教えてください",
      items,
      "https://zomeru.dev",
    );
    assert.equal(matches[0]?.source.id, "work:example");
    assert.deepEqual(retrieveOfflineKnowledge("unsafe", items, "https://zomeru.dev"), []);
  });

  void it("builds a prompt that explicitly forbids unsupported claims", () => {
    const matches = retrieveOfflineKnowledge("Batibot", items, "https://zomeru.dev");
    const prompt = buildOfflinePrompt("What is Batibot?", matches, []);
    assert.match(prompt.system, /Do not invent/u);
    assert.match(prompt.system, /Batibot/u);
  });
});
