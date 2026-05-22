import { describe, expect, it } from "vitest";

import { filterMessagesBySearch } from "../src/core/search";
import type { SavedMessage } from "../src/core/models";

describe("search", () => {
  it("filters case-insensitively while preserving input order", () => {
    const messages = [message("a", "Alpha beta"), message("b", "Gamma"), message("c", "beta delta")];

    expect(filterMessagesBySearch(messages, "BETA").map((item) => item.id)).toEqual(["a", "c"]);
    expect(filterMessagesBySearch(messages, "").map((item) => item.id)).toEqual(["a", "b", "c"]);
  });
});

function message(id: string, contentText: string): SavedMessage {
  return {
    id,
    threadId: "thread",
    sourceMessageId: id,
    sourceMessageKey: id,
    contentHash: id,
    role: "assistant",
    contentMarkdown: contentText,
    contentText,
    sortOrder: 0,
    createdAt: 1,
    updatedAt: 1,
  };
}
