import { beforeEach, describe, expect, it } from "vitest";

import { contentHashFromParts, createId } from "../src/core/hash";
import { markdownToPlainText } from "../src/core/markdown";
import {
  appendMessage,
  appendSavedMessageFromChatGpt,
  createImageAsset,
  createFolder,
  createNotebook,
  deleteFolder,
  deleteMessage,
  deleteSelectedTextFromMessage,
  deleteThread,
  getActiveSaveTargetThread,
  getAssetsForThread,
  getFolders,
  getActiveSaveTargetMessage,
  getNotebookAsset,
  getNotebookAutosaveMetadata,
  getMessagesInOrder,
  getNotebookBackupSnapshot,
  getSavedStateForVisibleMessages,
  getThread,
  getThreadBySource,
  getThreads,
  mergeMessages,
  mergeNotebookDataFromBackup,
  moveFolderAfterFolder,
  moveMessageAfterMessage,
  moveThreadAfterThread,
  moveThreadToFolder,
  markNotebookBackupSucceeded,
  renameNotebook,
  renameFolder,
  renameThreadTitle,
  reorderMessage,
  reorderThread,
  recordNotebookDataMutation,
  restoreDeletedMessage,
  restoreNotebookSnapshot,
  setActiveSaveTargetMessage,
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

  it("keeps DeepWiki and ChatGPT source threads separate", async () => {
    const chatGpt = await appendSavedMessageFromChatGpt(saveInput("shared", "chat note"));
    const deepWiki = await appendSavedMessageFromChatGpt({
      ...saveInput("shared", "wiki note"),
      source: "deepwiki",
      title: "RPC System",
    });

    expect(chatGpt.thread.source).toBe("chatgpt");
    expect(deepWiki.thread.source).toBe("deepwiki");
    expect(chatGpt.thread.id).not.toBe(deepWiki.thread.id);
    expect(await getThreadBySource("conversation", "chatgpt")).toMatchObject({ id: chatGpt.thread.id });
    expect(await getThreadBySource("conversation", "deepwiki")).toMatchObject({ id: deepWiki.thread.id });
  });

  it("appends repeated exports when each click has a unique export key", async () => {
    const first = await appendSavedMessageFromChatGpt(saveInput("export:one:click-1", "hello"));
    await appendSavedMessageFromChatGpt(saveInput("export:one:click-2", "hello"));
    const messages = await getMessagesInOrder(first.thread.id);

    expect(messages).toHaveLength(2);
    expect(messages.map((message) => message.contentText)).toEqual(["hello", "hello"]);
  });

  it("stores image assets separately from note markdown", async () => {
    const notebook = await createNotebook({ title: "Images" });
    const note = await appendMessage(notebook.id, messageInput("Draft note"));
    const file = new File([new Uint8Array([1, 2, 3])], "diagram.png", { type: "image/png" });
    const asset = await createImageAsset({ threadId: notebook.id, messageId: note.id, file, filename: "diagram.png" });

    expect(asset.threadId).toBe(notebook.id);
    expect(asset.messageId).toBe(note.id);
    expect(asset.mimeType).toBe("image/png");
    expect(asset.altText).toBe("diagram");

    await updateMessageContent(notebook.id, note.id, `Look here:\n\n![diagram](cgpt-asset:${asset.id})`);

    expect(await getNotebookAsset(asset.id)).toMatchObject({ id: asset.id, byteSize: 3 });
    expect(await getAssetsForThread(notebook.id)).toHaveLength(1);
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

  it("restores a deleted message at its original position", async () => {
    const first = await appendSavedMessageFromChatGpt(saveInput("a", "alpha"));
    await appendSavedMessageFromChatGpt(saveInput("b", "bravo"));
    await appendSavedMessageFromChatGpt(saveInput("c", "charlie"));
    const initialMessages = await getMessagesInOrder(first.thread.id);

    await deleteMessage(first.thread.id, initialMessages[1].id);
    expect((await getMessagesInOrder(first.thread.id)).map((message) => message.contentText)).toEqual([
      "alpha",
      "charlie",
    ]);

    const restored = await restoreDeletedMessage(initialMessages[1]);
    const restoredMessages = await getMessagesInOrder(first.thread.id);

    expect(restored.id).toBe(initialMessages[1].id);
    expect(restoredMessages.map((message) => message.contentText)).toEqual(["alpha", "bravo", "charlie"]);
    expect((await getThread(first.thread.id))?.messageCount).toBe(3);
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

  it("restores a whole notebook snapshot after merges, deletes, and edits", async () => {
    const first = await appendSavedMessageFromChatGpt(saveInput("a", "alpha"));
    await appendSavedMessageFromChatGpt(saveInput("b", "bravo"));
    await appendSavedMessageFromChatGpt(saveInput("c", "charlie"));
    const snapshot = {
      thread: (await getThread(first.thread.id))!,
      messages: await getMessagesInOrder(first.thread.id),
    };
    const initialMessageIds = snapshot.messages.map((message) => message.id);

    await mergeMessages(first.thread.id, [initialMessageIds[0], initialMessageIds[1]]);
    await deleteMessage(first.thread.id, initialMessageIds[2]);
    await renameThreadTitle(first.thread.id, "Changed title");

    expect(await getMessagesInOrder(first.thread.id)).toHaveLength(1);

    await restoreNotebookSnapshot(snapshot);
    const restoredThread = await getThread(first.thread.id);
    const restoredMessages = await getMessagesInOrder(first.thread.id);

    expect(restoredThread?.title).toBe(snapshot.thread.title);
    expect(restoredThread?.messageCount).toBe(3);
    expect(restoredMessages.map((message) => message.id)).toEqual(initialMessageIds);
    expect(restoredMessages.map((message) => message.contentText)).toEqual(["alpha", "bravo", "charlie"]);
  });

  it("reorders messages inside a notebook without losing message order", async () => {
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

  it("moves messages directly after any target message for drag reordering", async () => {
    const first = await appendSavedMessageFromChatGpt(saveInput("a", "alpha"));
    await appendSavedMessageFromChatGpt(saveInput("b", "bravo"));
    await appendSavedMessageFromChatGpt(saveInput("c", "charlie"));
    const initialMessages = await getMessagesInOrder(first.thread.id);

    await moveMessageAfterMessage(first.thread.id, initialMessages[2].id, null);
    expect((await getMessagesInOrder(first.thread.id)).map((message) => message.contentText)).toEqual([
      "charlie",
      "alpha",
      "bravo",
    ]);

    await moveMessageAfterMessage(first.thread.id, initialMessages[2].id, initialMessages[1].id);
    expect((await getMessagesInOrder(first.thread.id)).map((message) => message.contentText)).toEqual([
      "alpha",
      "bravo",
      "charlie",
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

  it("appends ChatGPT exports into the selected save target note", async () => {
    const notebook = await createNotebook({ title: "Backend notes" });
    const note = await appendMessage(notebook.id, messageInput("Draft note"));

    await setActiveSaveTargetMessage(note.id);

    const saved = await appendSavedMessageFromChatGpt(saveInput("export:one:click-1", "selected text"));
    const notebookMessages = await getMessagesInOrder(notebook.id);

    expect(saved.thread.id).toBe(notebook.id);
    expect(saved.message.id).toBe(note.id);
    expect(saved.status).toBe("updated");
    expect((await getActiveSaveTargetMessage())?.id).toBe(note.id);
    expect(notebookMessages).toHaveLength(1);
    expect(notebookMessages[0].contentMarkdown).toBe("Draft note\n\nselected text");
    expect(notebookMessages[0].contentText).toBe("Draft note selected text");
  });

  it("appends manually created notes to a notebook", async () => {
    const notebook = await createNotebook({ title: "Scratch" });
    const note = await appendMessage(notebook.id, {
      sourceMessageId: null,
      sourceMessageKey: "manual:note",
      contentHash: "hash-manual-note",
      role: "note",
      title: "New note",
      contentMarkdown: "",
      contentText: "",
    });
    const messages = await getMessagesInOrder(notebook.id);

    expect(note.title).toBe("New note");
    expect(messages.map((message) => message.id)).toEqual([note.id]);
    expect((await getThread(notebook.id))?.messageCount).toBe(1);
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

  it("creates folders and moves notebooks between folder groups", async () => {
    const folder = await createFolder({ title: "Work" });
    const personal = await createFolder({ title: "Personal" });
    const first = await createNotebook({ title: "First" });
    const second = await createNotebook({ title: "Second", folderId: folder.id });

    expect((await getFolders()).map((item) => item.id)).toEqual([personal.id, folder.id]);
    expect((await getThread(second.id))?.folderId).toBe(folder.id);

    await moveThreadToFolder(first.id, folder.id);
    expect((await getThread(first.id))?.folderId).toBe(folder.id);

    await renameFolder(personal.id, "Life");
    expect((await getFolders()).map((item) => item.title)).toEqual(["Life", "Work"]);

    await deleteFolder(folder.id);
    expect((await getFolders()).map((item) => item.id)).toEqual([personal.id]);
    expect((await getThread(first.id))?.folderId).toBeNull();
    expect((await getThread(second.id))?.folderId).toBeNull();
  });

  it("moves folders directly after another folder", async () => {
    const work = await createFolder({ title: "Work" });
    const personal = await createFolder({ title: "Personal" });
    const archive = await createFolder({ title: "Archive" });

    expect((await getFolders()).map((item) => item.id)).toEqual([archive.id, personal.id, work.id]);

    await moveFolderAfterFolder(work.id, archive.id);
    expect((await getFolders()).map((item) => item.id)).toEqual([archive.id, work.id, personal.id]);

    await moveFolderAfterFolder(personal.id, null);
    expect((await getFolders()).map((item) => item.id)).toEqual([personal.id, archive.id, work.id]);
  });

  it("moves notebooks directly after another notebook within the same folder", async () => {
    const folder = await createFolder({ title: "Work" });
    const first = await createNotebook({ title: "First", folderId: folder.id });
    const second = await createNotebook({ title: "Second", folderId: folder.id });
    const third = await createNotebook({ title: "Third", folderId: folder.id });

    expect((await getThreads()).map((thread) => thread.id)).toEqual([third.id, second.id, first.id]);

    await moveThreadAfterThread(first.id, third.id);
    expect((await getThreads()).map((thread) => thread.id)).toEqual([third.id, first.id, second.id]);

    await moveThreadAfterThread(second.id, null);
    expect((await getThreads()).map((thread) => thread.id)).toEqual([second.id, third.id, first.id]);
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

  it("tracks autosave revisions separately from notebook data", async () => {
    expect(await getNotebookAutosaveMetadata()).toMatchObject({
      dataRevision: 0,
      lastBackupRevision: 0,
      lastBackupAt: null,
      lastBackupError: null,
    });

    expect(await recordNotebookDataMutation()).toBe(1);
    expect(await recordNotebookDataMutation()).toBe(2);

    await markNotebookBackupSucceeded({
      revision: 2,
      backedUpAt: "2026-05-22T09:30:00.000Z",
      dailyBackupDate: "2026-05-22",
    });

    expect(await getNotebookAutosaveMetadata()).toMatchObject({
      dataRevision: 2,
      lastBackupRevision: 2,
      lastBackupAt: "2026-05-22T09:30:00.000Z",
      lastDailyBackupDate: "2026-05-22",
    });
  });

  it("merges a full backup snapshot without deleting current notebooks", async () => {
    const folder = await createFolder({ title: "Recovered" });
    const notebook = await createNotebook({ title: "Backup source", folderId: folder.id });
    const note = await appendMessage(notebook.id, messageInput("Saved note"));
    const file = new File([new Uint8Array([1, 2, 3])], "diagram.png", { type: "image/png" });
    const asset = await createImageAsset({ threadId: notebook.id, messageId: note.id, file, filename: "diagram.png" });
    await setActiveSaveTargetThread(notebook.id);
    const backup = await getNotebookBackupSnapshot();

    await resetDatabaseForTests();
    const existing = await createNotebook({ title: "Existing data" });
    await mergeNotebookDataFromBackup({
      app: "chatgpt-notes-sidebar",
      backupVersion: 1,
      exportedAt: new Date(Date.UTC(2026, 4, 22, 9, 30, 0)).toISOString(),
      counts: {
        folders: backup.folders.length,
        threads: backup.threads.length,
        messages: backup.messages.length,
        settings: backup.settings.length,
        aiOperationProposals: backup.aiOperationProposals.length,
        assets: backup.assets.length,
      },
      ...backup,
    });

    expect((await getFolders()).map((item) => item.title)).toEqual(["Recovered"]);
    expect((await getThreads()).map((thread) => thread.title)).toEqual(["Existing data", "Backup source"]);
    expect(await getThread(existing.id)).toMatchObject({ title: "Existing data" });
    expect((await getMessagesInOrder(notebook.id)).map((message) => message.contentMarkdown)).toEqual(["Saved note"]);
    expect(await getActiveSaveTargetThread()).toMatchObject({ id: notebook.id });
    expect(await getNotebookAsset(asset.id)).toMatchObject({ id: asset.id, byteSize: 3 });
  });

  it("merges backup messages into an existing source thread with a different local id", async () => {
    const imported = await appendSavedMessageFromChatGpt(saveInput("imported", "from backup"));
    const backup = await getNotebookBackupSnapshot();

    await resetDatabaseForTests();
    const current = await appendSavedMessageFromChatGpt(saveInput("current", "current note"));

    await mergeNotebookDataFromBackup({
      app: "chatgpt-notes-sidebar",
      backupVersion: 1,
      exportedAt: new Date(Date.UTC(2026, 4, 22, 9, 30, 0)).toISOString(),
      counts: {
        folders: backup.folders.length,
        threads: backup.threads.length,
        messages: backup.messages.length,
        settings: backup.settings.length,
        aiOperationProposals: backup.aiOperationProposals.length,
        assets: backup.assets.length,
      },
      ...backup,
    });

    const threads = await getThreads();
    const messages = await getMessagesInOrder(current.thread.id);

    expect(threads).toHaveLength(1);
    expect(threads[0].id).toBe(current.thread.id);
    expect(messages.map((message) => message.contentText)).toEqual(["current note", "from backup"]);
    expect(messages.every((message) => message.threadId === current.thread.id)).toBe(true);
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

function messageInput(contentMarkdown: string) {
  const contentText = markdownToPlainText(contentMarkdown);

  return {
    sourceMessageId: null,
    sourceMessageKey: createId("test-note"),
    contentHash: contentHashFromParts({ contentMarkdown, contentText }),
    role: "note" as const,
    contentMarkdown,
    contentText,
  };
}
