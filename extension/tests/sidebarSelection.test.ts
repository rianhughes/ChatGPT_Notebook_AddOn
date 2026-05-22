import { describe, expect, it } from "vitest";

import { joinMessagesForCopy } from "../src/core/clipboard";
import { filterMessagesBySearch } from "../src/core/search";
import type { SavedMessage } from "../src/core/models";

describe("sidebar selection copy behavior", () => {
  it("copies selected visible messages in display order", () => {
    const orderedMessages = [
      message("a", "alpha"),
      message("b", "bravo match"),
      message("c", "charlie match"),
    ];
    const visibleMessages = filterMessagesBySearch(orderedMessages, "match");
    const selectedIds = new Set(visibleMessages.map((item) => item.id));
    const selectedVisibleMessages = visibleMessages.filter((item) => selectedIds.has(item.id));

    expect(joinMessagesForCopy(selectedVisibleMessages)).toBe("bravo match\n\ncharlie match");
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
