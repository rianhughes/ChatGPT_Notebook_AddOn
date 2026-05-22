import { describe, expect, it } from "vitest";

import {
  getMessagesInOrder,
  insertMessageAfter,
  moveMessageAfter,
  renumberMessages,
} from "../src/core/messageOrder";
import type { ChatGptThread, SavedMessage } from "../src/core/models";

describe("messageOrder", () => {
  it("sorts messages by numeric sort order", () => {
    const messages = [message("b", 1), message("a", 0), message("c", 2)];

    expect(getMessagesInOrder(thread(), messages).map((item) => item.id)).toEqual(["a", "b", "c"]);
  });

  it("inserts and moves messages by array position", () => {
    const messages = renumberMessages([message("a", 0), message("b", 1), message("c", 2)]);
    const withInserted = insertMessageAfter(messages, message("d", 0), "a");
    const moved = moveMessageAfter(withInserted, "c", null);

    expect(withInserted.map((item) => item.id)).toEqual(["a", "d", "b", "c"]);
    expect(moved.map((item) => item.id)).toEqual(["c", "a", "d", "b"]);
    expect(moved.map((item) => item.sortOrder)).toEqual([0, 1, 2, 3]);
  });

});

function thread(): ChatGptThread {
  return {
    id: "thread",
    source: "notebook",
    sourceThreadId: "notebook:thread",
    title: "Notebook",
    folderId: null,
    messageCount: 3,
    sortOrder: 0,
    createdAt: 1,
    updatedAt: 1,
  };
}

function message(id: string, sortOrder: number): SavedMessage {
  return {
    id,
    threadId: "thread",
    sourceMessageId: id,
    sourceMessageKey: id,
    contentHash: id,
    role: "assistant",
    title: id,
    contentMarkdown: id,
    contentText: id,
    sortOrder,
    createdAt: 1,
    updatedAt: 1,
  };
}
