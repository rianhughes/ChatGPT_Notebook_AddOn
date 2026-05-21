import { describe, expect, it } from "vitest";

import {
  appendMessage,
  assertThreadIntegrity,
  deleteMessage,
  getMessagesInOrder,
  insertMessageAfter,
  insertMessageBefore,
} from "../src/core/linkedList";
import type { ChatGptThread, SavedMessage } from "../src/core/models";

describe("linkedList", () => {
  it("appends to empty and non-empty threads", () => {
    const withOne = appendMessage(emptyState(), message("a"));
    const withTwo = appendMessage(withOne, message("b"));

    expect(withTwo.thread.headMessageId).toBe("a");
    expect(withTwo.thread.tailMessageId).toBe("b");
    expect(getMessagesInOrder(withTwo.thread, withTwo.messages).map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("inserts before the head and after the tail", () => {
    const initial = appendMessage(appendMessage(emptyState(), message("b")), message("c"));
    const withHead = insertMessageBefore(initial, "b", message("a"));
    const withTail = insertMessageAfter(withHead, "c", message("d"));

    expect(getMessagesInOrder(withTail.thread, withTail.messages).map((item) => item.id)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
    expect(withTail.thread.headMessageId).toBe("a");
    expect(withTail.thread.tailMessageId).toBe("d");
  });

  it("deletes only, head, middle, and tail messages", () => {
    const one = appendMessage(emptyState(), message("only"));
    expect(deleteMessage(one, "only").thread.messageCount).toBe(0);

    const four = ["a", "b", "c", "d"].reduce((state, id) => appendMessage(state, message(id)), emptyState());
    const withoutHead = deleteMessage(four, "a");
    const withoutMiddle = deleteMessage(withoutHead, "c");
    const withoutTail = deleteMessage(withoutMiddle, "d");

    expect(getMessagesInOrder(withoutTail.thread, withoutTail.messages).map((item) => item.id)).toEqual(["b"]);
  });

  it("detects pointer corruption and cycles", () => {
    const state = ["a", "b"].reduce((current, id) => appendMessage(current, message(id)), emptyState());
    const corruptThread = { ...state.thread, tailMessageId: "missing" };
    const cyclicMessages = state.messages.map((item) =>
      item.id === "b" ? { ...item, nextId: "a" } : item,
    );

    expect(() => assertThreadIntegrity(corruptThread, state.messages)).toThrow();
    expect(() => assertThreadIntegrity(state.thread, cyclicMessages)).toThrow();
  });
});

function emptyState() {
  const thread: ChatGptThread = {
    id: "thread",
    source: "chatgpt",
    sourceThreadId: "conversation",
    title: "Conversation",
    headMessageId: null,
    tailMessageId: null,
    messageCount: 0,
    createdAt: 1,
    updatedAt: 1,
  };

  return { thread, messages: [] as SavedMessage[] };
}

function message(id: string): SavedMessage {
  return {
    id,
    threadId: "thread",
    sourceMessageId: id,
    sourceMessageKey: `source:${id}`,
    contentHash: `hash:${id}`,
    role: "assistant",
    contentMarkdown: id,
    contentText: id,
    prevId: null,
    nextId: null,
    createdAt: 1,
    updatedAt: 1,
  };
}
