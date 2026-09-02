import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { selectAssistantMode } from "./assistant-mode";

void describe("assistant mode selection", () => {
  void it("keeps the server pipeline primary while online", () => {
    assert.equal(selectAssistantMode(false, true), "online");
    assert.equal(selectAssistantMode(false, false), "online");
  });

  void it("uses local inference only when offline and installed", () => {
    assert.equal(selectAssistantMode(true, true), "offline");
    assert.equal(selectAssistantMode(true, false), "unavailable");
  });
});
