import { describe, expect, it } from "vite-plus/test";

import { makeNote } from "@/test/factories";

import { byDraftThenNewest } from "./noteOrder";

describe("note order", () => {
  it("puts drafts first, then the newest visit first", () => {
    const old = makeNote({ id: "old", encounter_at: "2025-07-02T08:00:00Z" });
    const recent = makeNote({ id: "recent", encounter_at: "2026-05-08T16:00:00Z" });
    const draft = makeNote({
      id: "draft",
      status: "draft",
      finalized_at: null,
      encounter_at: "2024-01-01T08:00:00Z",
    });

    const order = [old, draft, recent].sort(byDraftThenNewest).map((n) => n.id);

    expect(order).toEqual(["draft", "recent", "old"]);
  });
});
