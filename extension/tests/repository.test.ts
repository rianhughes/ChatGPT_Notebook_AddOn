import { beforeEach, describe, expect, it } from "vitest";

import {
  appendSavedMessageFromChatGpt,
  createNotebook,
  deleteMessage,
  deleteSelectedTextFromMessage,
  deleteThread,
  getActiveSaveTargetThread,
  getMessagesInOrder,
  getSavedStateForVisibleMessages,
  getThread,
  getThreadBySource,
  getThreads,
  mergeMessages,
  renameNotebook,
  renameThreadTitle,
  reorderMessage,
  reorderThread,
  setActiveSaveTargetThread,
  updateMessageContent,
} from "../src/core/repository";
import { resetDatabaseForTests } from "../src/storage/db";

describe("repository", () => {
  beforeEach(async () => {
    await resetDatabaseForTests();
  });

  it("saves ChatGPT messages idempotently and updates changed streaming content", async () => {
    const created = await appendSavedMessageFromChatGpt(saveInput("one", "hello", "hash-a"));
    const duplicate = await appendSavedMessageFromChatGpt(saveInput("one", "hello", "hash-a"));
    const updated = await appendSavedMessageFromChatGpt(saveInput("one", "hello world", "hash-b"));
    const messages = await getMessagesInOrder(created.thread.id);

    expect(created.status).toBe("created");
    expect(duplicate.status).toBe("already_saved");
    expect(updated.status).toBe("updated");
    expect(messages).toHaveLength(1);
    expect(messages[0].contentText).toBe("hello world");
  });

  it("appends repeated exports when each click has a unique export key", async () => {
    const first = await appendSavedMessageFromChatGpt(saveInput("export:one:click-1", "hello"));
    await appendSavedMessageFromChatGpt(saveInput("export:one:click-2", "hello"));
    const messages = await getMessagesInOrder(first.thread.id);

    expect(messages).toHaveLength(2);
    expect(messages.map((message) => message.contentText)).toEqual(["hello", "hello"]);
  });

  it("deletes head, middle, and tail without corrupting order", async () => {
    const first = await appendSavedMessageFromChatGpt(saveInput("a", "alpha"));
    await appendSavedMessageFromChatGpt(saveInput("b", "bravo"));
    await appendSavedMessageFromChatGpt(saveInput("c", "charlie"));
    const thread = await getThreadBySource("conversation");
    const messages = await getMessagesInOrder(first.thread.id);

    expect(thread?.messageCount).toBe(3);

    await deleteMessage(first.thread.id, messages[0].id);
    await deleteMessage(first.thread.id, messages[1].id);
    await deleteMessage(first.thread.id, messages[2].id);

    expect(await getMessagesInOrder(first.thread.id)).toEqual([]);
  });

  it("deletes selected text from a saved message and keeps code block formatting", async () => {
    const saved = await appendSavedMessageFromChatGpt(
      saveInput("code-edit", "Use this: const answer = 42;", "hash-code", [
        "Use this:",
        "",
        "```ts",
        "const answer = 42;",
        "```",
      ].join("\n")),
    );

    const updated = await deleteSelectedTextFromMessage(
      saved.thread.id,
      saved.message.id,
      "const answer = 42;",
    );

    expect(updated?.contentMarkdown).toBe("Use this:\n\n```ts\n\n```");
    expect(updated?.contentText).toBe("Use this:");
  });

  it("deletes highlighted text across rendered paragraph line breaks", async () => {
    const saved = await appendSavedMessageFromChatGpt(
      saveInput("multiline-edit", "First paragraph. Second paragraph wraps. Third line. Keep this.", "hash-lines", [
        "First paragraph.",
        "",
        "Second paragraph wraps.",
        "Third line.",
        "",
        "Keep this.",
      ].join("\n")),
    );

    const updated = await deleteSelectedTextFromMessage(
      saved.thread.id,
      saved.message.id,
      ["First paragraph.", "Second paragraph wraps."].join("\n"),
    );

    expect(updated?.contentMarkdown).toBe("Third line.\n\nKeep this.");
    expect(updated?.contentText).toBe("Third line. Keep this.");
  });

  it("updates a saved message like a notebook editor", async () => {
    const saved = await appendSavedMessageFromChatGpt(saveInput("editable", "old section"));
    const updated = await updateMessageContent(
      saved.thread.id,
      saved.message.id,
      ["# New section", "", "edited body", "", "```ts", "const next = true;", "```"].join("\n"),
    );
    const messages = await getMessagesInOrder(saved.thread.id);

    expect(updated.contentMarkdown).toContain("# New section");
    expect(updated.contentText).toBe("New section edited body const next = true;");
    expect(messages[0].contentMarkdown).toBe(updated.contentMarkdown);
  });

  it("defaults note titles from the first line and saves custom titles with edits", async () => {
    const saved = await appendSavedMessageFromChatGpt(
      saveInput("titled", "Architecture notes Details", "hash-titled", "## Architecture notes\n\nDetails"),
    );

    expect(saved.message.title).toBe("Architecture notes");

    const updated = await updateMessageContent(
      saved.thread.id,
      saved.message.id,
      "## Architecture notes\n\nExpanded details",
      "Custom summary",
    );

    expect(updated.title).toBe("Custom summary");
    expect(updated.contentMarkdown).toBe("## Architecture notes\n\nExpanded details");
  });

  it("merges selected messages into the first selected message and removes the rest", async () => {
    const first = await appendSavedMessageFromChatGpt(saveInput("a", "alpha"));
    await appendSavedMessageFromChatGpt(saveInput("b", "bravo"));
    await appendSavedMessageFromChatGpt(saveInput("c", "charlie"));
    const initialMessages = await getMessagesInOrder(first.thread.id);

    const merged = await mergeMessages(first.thread.id, [initialMessages[2].id, initialMessages[0].id]);
    const messages = await getMessagesInOrder(first.thread.id);
    const thread = await getThreadBySource("conversation");

    expect(merged?.id).toBe(initialMessages[0].id);
    expect(merged?.role).toBe("note");
    expect(merged?.sourceMessageId).toBeNull();
    expect(messages.map((message) => message.contentMarkdown)).toEqual(["alpha\n\ncharlie", "bravo"]);
    expect(messages.map((message) => message.id)).toEqual([initialMessages[0].id, initialMessages[1].id]);
    expect(thread?.messageCount).toBe(2);
  });

  it("reorders messages inside a notebook without losing linked-list integrity", async () => {
    const first = await appendSavedMessageFromChatGpt(saveInput("a", "alpha"));
    await appendSavedMessageFromChatGpt(saveInput("b", "bravo"));
    await appendSavedMessageFromChatGpt(saveInput("c", "charlie"));
    const initialMessages = await getMessagesInOrder(first.thread.id);

    await reorderMessage(first.thread.id, initialMessages[2].id, "up");
    expect((await getMessagesInOrder(first.thread.id)).map((message) => message.contentText)).toEqual([
      "alpha",
      "charlie",
      "bravo",
    ]);

    await reorderMessage(first.thread.id, initialMessages[0].id, "down");
    expect((await getMessagesInOrder(first.thread.id)).map((message) => message.contentText)).toEqual([
      "charlie",
      "alpha",
      "bravo",
    ]);
  });

  it("saves ChatGPT messages into the active user notebook", async () => {
    const notebook = await createNotebook({ title: "Backend notes" });
    await setActiveSaveTargetThread(notebook.id);

    const saved = await appendSavedMessageFromChatGpt(saveInput("notebook-message", "selected text"));
    const notebookMessages = await getMessagesInOrder(notebook.id);

    expect(saved.thread.id).toBe(notebook.id);
    expect((await getActiveSaveTargetThread())?.id).toBe(notebook.id);
    expect(await getThreadBySource("conversation")).toBeNull();
    expect(notebookMessages.map((message) => message.contentText)).toEqual(["selected text"]);
    expect(
      await getSavedStateForVisibleMessages("conversation", ["source:notebook-message", "source:other"]),
    ).toEqual({
      "source:notebook-message": true,
      "source:other": false,
    });
  });

  it("renames notebooks but not ChatGPT conversation threads", async () => {
    const notebook = await createNotebook({ title: "Backend notes" });
    const renamed = await renameNotebook(notebook.id, "Architecture notes");
    const chatGptThread = await appendSavedMessageFromChatGpt(saveInput("chatgpt-message", "hello"));

    expect(renamed.title).toBe("Architecture notes");
    expect((await getActiveSaveTargetThread())).toBeNull();
    await expect(renameNotebook(chatGptThread.thread.id, "Manual title")).rejects.toThrow(
      "Only notebooks can be renamed",
    );
  });

  it("reorders notebooks manually and keeps that order after title updates", async () => {
    const first = await createNotebook({ title: "First" });
    const second = await createNotebook({ title: "Second" });
    const third = await createNotebook({ title: "Third" });

    expect((await getThreads()).map((thread) => thread.id)).toEqual([third.id, second.id, first.id]);

    await reorderThread(first.id, "up");
    expect((await getThreads()).map((thread) => thread.id)).toEqual([third.id, first.id, second.id]);

    await renameThreadTitle(second.id, "Second renamed");
    expect((await getThreads()).map((thread) => thread.id)).toEqual([third.id, first.id, second.id]);

    await reorderThread(third.id, "down");
    expect((await getThreads()).map((thread) => thread.id)).toEqual([first.id, third.id, second.id]);
  });

  it("deletes a notebook, its messages, and active save target setting", async () => {
    const notebook = await createNotebook({ title: "Scratch" });
    await setActiveSaveTargetThread(notebook.id);
    await appendSavedMessageFromChatGpt(saveInput("note", "saved in notebook"));

    await deleteThread(notebook.id);

    expect(await getThread(notebook.id)).toBeNull();
    expect(await getMessagesInOrder(notebook.id)).toEqual([]);
    expect(await getActiveSaveTargetThread()).toBeNull();
  });
});

function saveInput(
  key: string,
  contentText: string,
  hash = `hash-${key}`,
  contentMarkdown = contentText,
) {
  return {
    sourceThreadId: "conversation",
    title: "Conversation",
    sourceMessageId: key,
    sourceMessageKey: key.startsWith("export:") ? key : `source:${key}`,
    contentHash: hash,
    role: "assistant" as const,
    contentMarkdown,
    contentText,
  };
}
