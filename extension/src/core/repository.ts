import { notesDb } from "../storage/db";
import { contentHashFromParts, createId } from "./hash";
import { deleteExactTextFromMarkdown, markdownToPlainText } from "./markdown";
import type {
  AppendMessageInput,
  ChatGptThread,
  ChatGptThreadInput,
  NotebookFolder,
  NotebookFolderInput,
  NotebookInput,
  SaveChatGptMessageInput,
  SaveChatGptMessageResult,
  SavedMessage,
} from "./models";
import {
  appendMessage as appendMessageToState,
  getMessagesInOrder as orderMessages,
  insertMessageAfter as insertMessageAfterInState,
  insertMessageBefore as insertMessageBeforeInState,
  moveMessageAfter,
} from "./linkedList";

export type NotebookSnapshot = {
  thread: ChatGptThread;
  messages: SavedMessage[];
};

export async function getThreads(): Promise<ChatGptThread[]> {
  const threads = await notesDb.threads.toArray();
  return sortThreads(threads);
}

export async function getFolders(): Promise<NotebookFolder[]> {
  const folders = await notesDb.folders.toArray();
  return sortFolders(folders);
}

export async function getThread(threadId: string): Promise<ChatGptThread | null> {
  return (await notesDb.threads.get(threadId)) ?? null;
}

export async function getThreadBySource(sourceThreadId: string): Promise<ChatGptThread | null> {
  return (
    (await notesDb.threads
      .where("[source+sourceThreadId]")
      .equals(["chatgpt", sourceThreadId])
      .first()) ?? null
  );
}

export async function getOrCreateChatGptThread(input: ChatGptThreadInput): Promise<ChatGptThread> {
  return notesDb.transaction("rw", notesDb.threads, async () => {
    const existing = await notesDb.threads
      .where("[source+sourceThreadId]")
      .equals(["chatgpt", input.sourceThreadId])
      .first();

    if (existing) {
      if (input.title && existing.title !== input.title) {
        const updated = { ...existing, title: input.title, updatedAt: Date.now() };
        await notesDb.threads.put(updated);
        return updated;
      }

      return existing;
    }

    const timestamp = Date.now();
    const thread: ChatGptThread = {
      id: createId("thread"),
      source: "chatgpt",
      sourceThreadId: input.sourceThreadId,
      title: input.title || "Untitled ChatGPT conversation",
      folderId: null,
      headMessageId: null,
      tailMessageId: null,
      messageCount: 0,
      sortOrder: await getNextThreadSortOrderInTransaction(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await notesDb.threads.add(thread);
    return thread;
  });
}

export async function createNotebook(input: NotebookInput): Promise<ChatGptThread> {
  return notesDb.transaction("rw", notesDb.threads, notesDb.folders, async () => {
    const folderId = await normalizeFolderIdInTransaction(input.folderId ?? null);
    const timestamp = Date.now();
    const id = createId("thread");
    const thread: ChatGptThread = {
      id,
      source: "notebook",
      sourceThreadId: `notebook:${id}`,
      title: input.title.trim() || "Untitled notebook",
      folderId,
      headMessageId: null,
      tailMessageId: null,
      messageCount: 0,
      sortOrder: await getNextThreadSortOrderInTransaction(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await notesDb.threads.add(thread);
    return thread;
  });
}

export async function createFolder(input: NotebookFolderInput): Promise<NotebookFolder> {
  return notesDb.transaction("rw", notesDb.folders, async () => {
    const timestamp = Date.now();
    const folder: NotebookFolder = {
      id: createId("folder"),
      title: input.title.trim() || "Untitled folder",
      sortOrder: await getNextFolderSortOrderInTransaction(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await notesDb.folders.add(folder);
    return folder;
  });
}

export async function renameFolder(folderId: string, title: string): Promise<NotebookFolder> {
  return notesDb.transaction("rw", notesDb.folders, async () => {
    const folder = await notesDb.folders.get(folderId);

    if (!folder) {
      throw new Error(`Missing folder ${folderId}`);
    }

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      throw new Error("Folder title cannot be empty");
    }

    const updated: NotebookFolder = {
      ...folder,
      title: trimmedTitle,
      updatedAt: Date.now(),
    };

    await notesDb.folders.put(updated);
    return updated;
  });
}

export async function deleteFolder(folderId: string): Promise<void> {
  await notesDb.transaction("rw", notesDb.folders, notesDb.threads, async () => {
    const timestamp = Date.now();
    const threadsInFolder = await notesDb.threads.where("folderId").equals(folderId).toArray();

    if (threadsInFolder.length > 0) {
      await notesDb.threads.bulkPut(
        threadsInFolder.map((thread) => ({
          ...thread,
          folderId: null,
          updatedAt: timestamp,
        })),
      );
    }

    await notesDb.folders.delete(folderId);
  });
}

export async function moveThreadToFolder(
  threadId: string,
  folderId: string | null,
): Promise<ChatGptThread> {
  return notesDb.transaction("rw", notesDb.threads, notesDb.folders, async () => {
    const thread = await requireThread(threadId);
    const nextFolderId = await normalizeFolderIdInTransaction(folderId);
    const updated: ChatGptThread = {
      ...thread,
      folderId: nextFolderId,
      updatedAt: Date.now(),
    };

    await notesDb.threads.put(updated);
    return updated;
  });
}

export type ThreadMoveDirection = "up" | "down";

export async function reorderThread(
  threadId: string,
  direction: ThreadMoveDirection,
): Promise<ChatGptThread[]> {
  return notesDb.transaction("rw", notesDb.threads, async () => {
    const threads = sortThreads(await notesDb.threads.toArray());
    const currentThread = threads.find((thread) => thread.id === threadId);

    if (!currentThread) {
      throw new Error(`Missing thread ${threadId}`);
    }

    const currentFolderId = currentThread.folderId ?? null;
    const folderThreads = threads.filter((thread) => (thread.folderId ?? null) === currentFolderId);
    const currentIndex = folderThreads.findIndex((thread) => thread.id === threadId);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= folderThreads.length) {
      return threads;
    }

    const targetThread = folderThreads[targetIndex];
    const timestamp = Date.now();
    const updatedThreads = threads.map((thread) => {
      if (thread.id === currentThread.id) {
        return {
          ...thread,
          sortOrder: getThreadSortOrder(targetThread),
          updatedAt: timestamp,
        };
      }

      if (thread.id === targetThread.id) {
        return {
          ...thread,
          sortOrder: getThreadSortOrder(currentThread),
          updatedAt: timestamp,
        };
      }

      return thread;
    });

    await notesDb.threads.bulkPut(updatedThreads);
    return sortThreads(updatedThreads);
  });
}

export async function deleteThread(threadId: string): Promise<void> {
  await notesDb.transaction("rw", notesDb.threads, notesDb.messages, notesDb.settings, async () => {
    const thread = await notesDb.threads.get(threadId);

    if (!thread) {
      return;
    }

    await notesDb.messages.where("threadId").equals(threadId).delete();
    await notesDb.threads.delete(threadId);

    const activeSaveTarget = await notesDb.settings.get("activeSaveTargetThreadId");

    if (activeSaveTarget?.value === threadId) {
      await notesDb.settings.put({
        key: "activeSaveTargetThreadId",
        value: null,
        updatedAt: Date.now(),
      });
    }
  });
}

export async function renameNotebook(threadId: string, title: string): Promise<ChatGptThread> {
  return notesDb.transaction("rw", notesDb.threads, async () => {
    const thread = await requireThread(threadId);

    if (thread.source !== "notebook") {
      throw new Error("Only notebooks can be renamed");
    }

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      throw new Error("Notebook title cannot be empty");
    }

    const updated: ChatGptThread = {
      ...thread,
      title: trimmedTitle,
      updatedAt: Date.now(),
    };

    await notesDb.threads.put(updated);
    return updated;
  });
}

export async function renameThreadTitle(threadId: string, title: string): Promise<ChatGptThread> {
  return notesDb.transaction("rw", notesDb.threads, async () => {
    const thread = await requireThread(threadId);
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      throw new Error("Thread title cannot be empty");
    }

    const updated: ChatGptThread = {
      ...thread,
      title: trimmedTitle,
      updatedAt: Date.now(),
    };

    await notesDb.threads.put(updated);
    return updated;
  });
}

export async function getActiveSaveTargetThread(): Promise<ChatGptThread | null> {
  const setting = await notesDb.settings.get("activeSaveTargetThreadId");

  if (!setting?.value) {
    return null;
  }

  const thread = await notesDb.threads.get(setting.value);

  if (!thread) {
    await notesDb.settings.delete("activeSaveTargetThreadId");
    return null;
  }

  return thread;
}

export async function setActiveSaveTargetThread(threadId: string | null): Promise<ChatGptThread | null> {
  return notesDb.transaction("rw", notesDb.threads, notesDb.settings, async () => {
    const timestamp = Date.now();

    if (!threadId) {
      await notesDb.settings.put({
        key: "activeSaveTargetThreadId",
        value: null,
        updatedAt: timestamp,
      });
      return null;
    }

    const thread = await notesDb.threads.get(threadId);

    if (!thread) {
      throw new Error(`Missing save target thread ${threadId}`);
    }

    await notesDb.settings.put({
      key: "activeSaveTargetThreadId",
      value: threadId,
      updatedAt: timestamp,
    });

    return thread;
  });
}

export async function getMessagesInOrder(threadId: string): Promise<SavedMessage[]> {
  const thread = await notesDb.threads.get(threadId);

  if (!thread) {
    return [];
  }

  const messages = await notesDb.messages.where("threadId").equals(threadId).toArray();
  return orderMessages(thread, messages);
}

export async function restoreNotebookSnapshot(snapshot: NotebookSnapshot): Promise<SavedMessage[]> {
  return notesDb.transaction("rw", notesDb.threads, notesDb.messages, async () => {
    const currentThread = await requireThread(snapshot.thread.id);
    const restoredMessageIds = new Set(snapshot.messages.map((message) => message.id));

    if (restoredMessageIds.size !== snapshot.messages.length) {
      throw new Error("Cannot restore notebook snapshot with duplicate messages");
    }

    const timestamp = Date.now();
    const restoredMessages = snapshot.messages.map((message, index, messages) => ({
      ...message,
      threadId: currentThread.id,
      prevId: messages[index - 1]?.id ?? null,
      nextId: messages[index + 1]?.id ?? null,
    }));
    const restoredThread: ChatGptThread = {
      ...currentThread,
      title: snapshot.thread.title,
      headMessageId: restoredMessages[0]?.id ?? null,
      tailMessageId: restoredMessages[restoredMessages.length - 1]?.id ?? null,
      messageCount: restoredMessages.length,
      updatedAt: timestamp,
    };

    await notesDb.messages.where("threadId").equals(currentThread.id).delete();

    if (restoredMessages.length > 0) {
      await notesDb.messages.bulkPut(restoredMessages);
    }

    await notesDb.threads.put(restoredThread);
    return orderMessages(restoredThread, restoredMessages);
  });
}

export async function appendMessage(threadId: string, input: AppendMessageInput): Promise<SavedMessage> {
  return notesDb.transaction("rw", notesDb.threads, notesDb.messages, async () => {
    const thread = await requireThread(threadId);
    const timestamp = Date.now();
    const message = createSavedMessage(threadId, input, timestamp);

    await appendMessageInTransaction(thread, message, timestamp);
    return message;
  });
}

export async function appendSavedMessageFromChatGpt(
  input: SaveChatGptMessageInput,
): Promise<SaveChatGptMessageResult> {
  return notesDb.transaction("rw", notesDb.threads, notesDb.messages, notesDb.settings, async () => {
    const thread = await getSaveTargetThreadInTransaction({
      sourceThreadId: input.sourceThreadId,
      title: input.title,
    });
    const existing = await notesDb.messages
      .where("[threadId+sourceMessageKey]")
      .equals([thread.id, input.sourceMessageKey])
      .first();
    const timestamp = Date.now();

    if (existing) {
      if (existing.contentHash !== input.contentHash) {
        const updatedMessage: SavedMessage = {
          ...existing,
          contentHash: input.contentHash,
          contentMarkdown: input.contentMarkdown,
          contentText: input.contentText,
          updatedAt: timestamp,
        };
        const updatedThread = {
          ...thread,
          title: thread.source === "chatgpt" ? input.title || thread.title : thread.title,
          updatedAt: timestamp,
        };

        await notesDb.messages.put(updatedMessage);
        await notesDb.threads.put(updatedThread);

        return { thread: updatedThread, message: updatedMessage, status: "updated" };
      }

      return { thread, message: existing, status: "already_saved" };
    }

    const message = createSavedMessage(
      thread.id,
      {
        sourceMessageId: input.sourceMessageId,
        sourceMessageKey: input.sourceMessageKey,
        contentHash: input.contentHash,
        role: input.role,
        contentMarkdown: input.contentMarkdown,
        contentText: input.contentText,
      },
      timestamp,
    );

    if (input.insertAfterId) {
      const inserted = await insertMessageAfterInTransaction(thread, input.insertAfterId, message, timestamp);

      if (inserted) {
        return { thread: inserted, message, status: "created" };
      }
    }

    const updatedThread = await appendMessageInTransaction(thread, message, timestamp);
    return { thread: updatedThread, message, status: "created" };
  });
}

export async function deleteMessage(threadId: string, messageId: string): Promise<void> {
  await notesDb.transaction("rw", notesDb.threads, notesDb.messages, async () => {
    const thread = await requireThread(threadId);
    const node = await notesDb.messages.get(messageId);

    if (!node || node.threadId !== threadId) {
      return;
    }

    const previous = node.prevId ? await notesDb.messages.get(node.prevId) : null;
    const next = node.nextId ? await notesDb.messages.get(node.nextId) : null;
    const timestamp = Date.now();
    const updatedThread: ChatGptThread = {
      ...thread,
      headMessageId: previous ? thread.headMessageId : next?.id ?? null,
      tailMessageId: next ? thread.tailMessageId : previous?.id ?? null,
      messageCount: Math.max(0, thread.messageCount - 1),
      updatedAt: timestamp,
    };

    if (previous) {
      await notesDb.messages.put({ ...previous, nextId: next?.id ?? null, updatedAt: timestamp });
    }

    if (next) {
      await notesDb.messages.put({ ...next, prevId: previous?.id ?? null, updatedAt: timestamp });
    }

    await notesDb.messages.delete(messageId);
    await notesDb.threads.put(updatedThread);
  });
}

export async function restoreDeletedMessage(message: SavedMessage): Promise<SavedMessage> {
  return notesDb.transaction("rw", notesDb.threads, notesDb.messages, async () => {
    const thread = await requireThread(message.threadId);
    const existingMessage = await notesDb.messages.get(message.id);

    if (existingMessage) {
      if (existingMessage.threadId !== message.threadId) {
        throw new Error(`Message ${message.id} already exists in another thread`);
      }

      return existingMessage;
    }

    const sourceConflict = await notesDb.messages
      .where("[threadId+sourceMessageKey]")
      .equals([message.threadId, message.sourceMessageKey])
      .first();

    if (sourceConflict) {
      throw new Error(`Message source key ${message.sourceMessageKey} is already saved`);
    }

    const messages = await notesDb.messages.where("threadId").equals(message.threadId).toArray();
    const messageIds = new Set(messages.map((item) => item.id));
    const timestamp = Date.now();
    const restoredMessage: SavedMessage = {
      ...message,
      prevId: null,
      nextId: null,
      updatedAt: timestamp,
    };
    const state = { thread, messages };
    const nextState =
      message.prevId && messageIds.has(message.prevId)
        ? insertMessageAfterInState(state, message.prevId, restoredMessage)
        : message.nextId && messageIds.has(message.nextId)
          ? insertMessageBeforeInState(state, message.nextId, restoredMessage)
          : appendMessageToState(state, restoredMessage);

    await notesDb.messages.bulkPut(nextState.messages);
    await notesDb.threads.put(nextState.thread);

    return nextState.messages.find((item) => item.id === restoredMessage.id) ?? restoredMessage;
  });
}

export type MessageMoveDirection = "up" | "down";

export async function reorderMessage(
  threadId: string,
  messageId: string,
  direction: MessageMoveDirection,
): Promise<SavedMessage[]> {
  return notesDb.transaction("rw", notesDb.threads, notesDb.messages, async () => {
    const thread = await requireThread(threadId);
    const messages = await notesDb.messages.where("threadId").equals(threadId).toArray();
    const orderedMessages = orderMessages(thread, messages);
    const currentIndex = orderedMessages.findIndex((message) => message.id === messageId);

    if (currentIndex === -1) {
      throw new Error(`Missing message ${messageId}`);
    }

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= orderedMessages.length) {
      return orderedMessages;
    }

    const afterMessageId =
      direction === "up" ? orderedMessages[currentIndex - 2]?.id ?? null : orderedMessages[targetIndex].id;
    const nextState = moveMessageAfter({ thread, messages }, messageId, afterMessageId);
    const timestamp = Date.now();
    const updatedThread: ChatGptThread = {
      ...nextState.thread,
      updatedAt: timestamp,
    };
    const updatedMessages = nextState.messages.map((message) =>
      message.id === messageId ? { ...message, updatedAt: timestamp } : message,
    );

    await notesDb.messages.bulkPut(updatedMessages);
    await notesDb.threads.put(updatedThread);

    return orderMessages(updatedThread, updatedMessages);
  });
}

export async function moveMessageAfterMessage(
  threadId: string,
  messageId: string,
  afterMessageId: string | null,
): Promise<SavedMessage[]> {
  return notesDb.transaction("rw", notesDb.threads, notesDb.messages, async () => {
    const thread = await requireThread(threadId);
    const messages = await notesDb.messages.where("threadId").equals(threadId).toArray();
    const orderedMessages = orderMessages(thread, messages);

    if (!orderedMessages.some((message) => message.id === messageId)) {
      throw new Error(`Missing message ${messageId}`);
    }

    if (afterMessageId && !orderedMessages.some((message) => message.id === afterMessageId)) {
      throw new Error(`Missing target message ${afterMessageId}`);
    }

    const nextState = moveMessageAfter({ thread, messages }, messageId, afterMessageId);
    const timestamp = Date.now();
    const updatedThread: ChatGptThread = {
      ...nextState.thread,
      updatedAt: timestamp,
    };
    const updatedMessages = nextState.messages.map((message) =>
      message.id === messageId ? { ...message, updatedAt: timestamp } : message,
    );

    await notesDb.messages.bulkPut(updatedMessages);
    await notesDb.threads.put(updatedThread);

    return orderMessages(updatedThread, updatedMessages);
  });
}

export async function mergeMessages(threadId: string, messageIds: string[]): Promise<SavedMessage | null> {
  return notesDb.transaction("rw", notesDb.threads, notesDb.messages, async () => {
    let thread = await requireThread(threadId);
    const selectedIds = new Set(messageIds);

    if (selectedIds.size < 2) {
      return null;
    }

    const messages = await notesDb.messages.where("threadId").equals(threadId).toArray();
    const selectedMessages = orderMessages(thread, messages).filter((message) => selectedIds.has(message.id));

    if (selectedMessages.length < 2) {
      return null;
    }

    const timestamp = Date.now();
    const mergedMarkdown = selectedMessages
      .map((message) => (message.contentMarkdown || message.contentText).replace(/\r\n/g, "\n").trim())
      .filter(Boolean)
      .join("\n\n");
    const contentText = markdownToPlainText(mergedMarkdown);
    const primaryMessage = selectedMessages[0];
    const mergedMessage: SavedMessage = {
      ...primaryMessage,
      sourceMessageId: null,
      sourceMessageKey: createId("merge"),
      role: "note",
      contentMarkdown: mergedMarkdown,
      contentText,
      contentHash: contentHashFromParts({ contentMarkdown: mergedMarkdown, contentText }),
      updatedAt: timestamp,
    };

    await notesDb.messages.put(mergedMessage);

    for (const message of selectedMessages.slice(1)) {
      const node = await notesDb.messages.get(message.id);

      if (!node || node.threadId !== threadId) {
        continue;
      }

      thread = await deleteMessageFromThreadInTransaction(thread, node, timestamp);
    }

    await notesDb.threads.put({ ...thread, updatedAt: timestamp });
    return mergedMessage;
  });
}

export async function deleteSelectedTextFromMessage(
  threadId: string,
  messageId: string,
  selectedText: string,
): Promise<SavedMessage | null> {
  return notesDb.transaction("rw", notesDb.threads, notesDb.messages, async () => {
    const thread = await requireThread(threadId);
    const message = await notesDb.messages.get(messageId);

    if (!message || message.threadId !== threadId) {
      return null;
    }

    const nextMarkdown = deleteExactTextFromMarkdown(message.contentMarkdown || message.contentText, selectedText);

    if (nextMarkdown === null) {
      return null;
    }

    const timestamp = Date.now();
    const contentText = markdownToPlainText(nextMarkdown);
    const updatedMessage: SavedMessage = {
      ...message,
      contentMarkdown: nextMarkdown,
      contentText,
      contentHash: contentHashFromParts({ contentMarkdown: nextMarkdown, contentText }),
      updatedAt: timestamp,
    };

    await notesDb.messages.put(updatedMessage);
    await notesDb.threads.put({ ...thread, updatedAt: timestamp });

    return updatedMessage;
  });
}

export async function updateMessageContent(
  threadId: string,
  messageId: string,
  contentMarkdown: string,
  title?: string,
): Promise<SavedMessage> {
  return notesDb.transaction("rw", notesDb.threads, notesDb.messages, async () => {
    const thread = await requireThread(threadId);
    const message = await notesDb.messages.get(messageId);

    if (!message || message.threadId !== threadId) {
      throw new Error(`Missing message ${messageId}`);
    }

    const normalizedMarkdown = contentMarkdown.replace(/\r\n/g, "\n").trim();
    const contentText = markdownToPlainText(normalizedMarkdown);
    const timestamp = Date.now();
    const updatedMessage: SavedMessage = {
      ...message,
      title:
        title === undefined
          ? message.title
          : normalizeMessageTitle(title) || getDefaultMessageTitle(normalizedMarkdown),
      contentMarkdown: normalizedMarkdown,
      contentText,
      contentHash: contentHashFromParts({ contentMarkdown: normalizedMarkdown, contentText }),
      updatedAt: timestamp,
    };

    await notesDb.messages.put(updatedMessage);
    await notesDb.threads.put({ ...thread, updatedAt: timestamp });

    return updatedMessage;
  });
}

export async function isSourceMessageSaved(threadId: string, sourceMessageKey: string): Promise<boolean> {
  const message = await notesDb.messages
    .where("[threadId+sourceMessageKey]")
    .equals([threadId, sourceMessageKey])
    .first();
  return Boolean(message);
}

export async function getSavedStateForVisibleMessages(
  sourceThreadId: string,
  sourceMessageKeys: string[],
): Promise<Record<string, boolean>> {
  const states = Object.fromEntries(sourceMessageKeys.map((key) => [key, false]));
  const thread = (await getActiveSaveTargetThread()) ?? (await getThreadBySource(sourceThreadId));

  if (!thread || sourceMessageKeys.length === 0) {
    return states;
  }

  await Promise.all(
    sourceMessageKeys.map(async (sourceMessageKey) => {
      states[sourceMessageKey] = await isSourceMessageSaved(thread.id, sourceMessageKey);
    }),
  );

  return states;
}

async function getSaveTargetThreadInTransaction(input: ChatGptThreadInput): Promise<ChatGptThread> {
  const setting = await notesDb.settings.get("activeSaveTargetThreadId");

  if (setting?.value) {
    const activeThread = await notesDb.threads.get(setting.value);

    if (activeThread) {
      return activeThread;
    }

    await notesDb.settings.delete("activeSaveTargetThreadId");
  }

  return getOrCreateThreadInTransaction(input);
}

async function getOrCreateThreadInTransaction(input: ChatGptThreadInput): Promise<ChatGptThread> {
  const existing = await notesDb.threads
    .where("[source+sourceThreadId]")
    .equals(["chatgpt", input.sourceThreadId])
    .first();

  if (existing) {
    if (input.title && existing.title !== input.title) {
      const updated = { ...existing, title: input.title, updatedAt: Date.now() };
      await notesDb.threads.put(updated);
      return updated;
    }

    return existing;
  }

  const timestamp = Date.now();
  const thread: ChatGptThread = {
    id: createId("thread"),
    source: "chatgpt",
    sourceThreadId: input.sourceThreadId,
    title: input.title || "Untitled ChatGPT conversation",
    folderId: null,
    headMessageId: null,
    tailMessageId: null,
    messageCount: 0,
    sortOrder: await getNextThreadSortOrderInTransaction(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await notesDb.threads.add(thread);
  return thread;
}

async function getNextThreadSortOrderInTransaction(): Promise<number> {
  const threads = await notesDb.threads.toArray();

  if (threads.length === 0) {
    return 0;
  }

  return Math.min(...threads.map(getThreadSortOrder)) - 1;
}

async function getNextFolderSortOrderInTransaction(): Promise<number> {
  const folders = await notesDb.folders.toArray();

  if (folders.length === 0) {
    return 0;
  }

  return Math.min(...folders.map(getFolderSortOrder)) - 1;
}

async function normalizeFolderIdInTransaction(folderId: string | null): Promise<string | null> {
  if (!folderId) {
    return null;
  }

  const folder = await notesDb.folders.get(folderId);

  if (!folder) {
    throw new Error(`Missing folder ${folderId}`);
  }

  return folder.id;
}

function sortThreads(threads: ChatGptThread[]): ChatGptThread[] {
  return [...threads].sort((left, right) => {
    const leftSortOrder = getThreadSortOrder(left);
    const rightSortOrder = getThreadSortOrder(right);

    if (leftSortOrder !== rightSortOrder) {
      return leftSortOrder - rightSortOrder;
    }

    return right.updatedAt - left.updatedAt;
  });
}

function sortFolders(folders: NotebookFolder[]): NotebookFolder[] {
  return [...folders].sort((left, right) => {
    const leftSortOrder = getFolderSortOrder(left);
    const rightSortOrder = getFolderSortOrder(right);

    if (leftSortOrder !== rightSortOrder) {
      return leftSortOrder - rightSortOrder;
    }

    return right.updatedAt - left.updatedAt;
  });
}

function getThreadSortOrder(thread: ChatGptThread): number {
  return typeof thread.sortOrder === "number" ? thread.sortOrder : -thread.updatedAt;
}

function getFolderSortOrder(folder: NotebookFolder): number {
  return typeof folder.sortOrder === "number" ? folder.sortOrder : -folder.updatedAt;
}

async function appendMessageInTransaction(
  thread: ChatGptThread,
  message: SavedMessage,
  timestamp: number,
): Promise<ChatGptThread> {
  const updatedThread: ChatGptThread = {
    ...thread,
    headMessageId: thread.headMessageId ?? message.id,
    tailMessageId: message.id,
    messageCount: thread.messageCount + 1,
    updatedAt: timestamp,
  };

  if (thread.tailMessageId) {
    const tail = await notesDb.messages.get(thread.tailMessageId);

    if (!tail || tail.threadId !== thread.id) {
      throw new Error("Cannot append message because thread tail is corrupt");
    }

    await notesDb.messages.put({ ...tail, nextId: message.id, updatedAt: timestamp });
    message.prevId = tail.id;
  }

  await notesDb.messages.add(message);
  await notesDb.threads.put(updatedThread);
  return updatedThread;
}

async function insertMessageAfterInTransaction(
  thread: ChatGptThread,
  afterMessageId: string,
  message: SavedMessage,
  timestamp: number,
): Promise<ChatGptThread | null> {
  const after = await notesDb.messages.get(afterMessageId);

  if (!after || after.threadId !== thread.id) {
    return null;
  }

  const next = after.nextId ? await notesDb.messages.get(after.nextId) : null;
  const updatedThread: ChatGptThread = {
    ...thread,
    tailMessageId: next ? thread.tailMessageId : message.id,
    messageCount: thread.messageCount + 1,
    updatedAt: timestamp,
  };

  message.prevId = after.id;
  message.nextId = next?.id ?? null;

  await notesDb.messages.put({ ...after, nextId: message.id, updatedAt: timestamp });

  if (next) {
    await notesDb.messages.put({ ...next, prevId: message.id, updatedAt: timestamp });
  }

  await notesDb.messages.add(message);
  await notesDb.threads.put(updatedThread);
  return updatedThread;
}

async function deleteMessageFromThreadInTransaction(
  thread: ChatGptThread,
  node: SavedMessage,
  timestamp: number,
): Promise<ChatGptThread> {
  const previous = node.prevId ? await notesDb.messages.get(node.prevId) : null;
  const next = node.nextId ? await notesDb.messages.get(node.nextId) : null;
  const updatedThread: ChatGptThread = {
    ...thread,
    headMessageId: previous ? thread.headMessageId : next?.id ?? null,
    tailMessageId: next ? thread.tailMessageId : previous?.id ?? null,
    messageCount: Math.max(0, thread.messageCount - 1),
    updatedAt: timestamp,
  };

  if (previous) {
    await notesDb.messages.put({ ...previous, nextId: next?.id ?? null, updatedAt: timestamp });
  }

  if (next) {
    await notesDb.messages.put({ ...next, prevId: previous?.id ?? null, updatedAt: timestamp });
  }

  await notesDb.messages.delete(node.id);
  return updatedThread;
}

async function requireThread(threadId: string): Promise<ChatGptThread> {
  const thread = await notesDb.threads.get(threadId);

  if (!thread) {
    throw new Error(`Missing thread ${threadId}`);
  }

  return thread;
}

function createSavedMessage(
  threadId: string,
  input: AppendMessageInput,
  timestamp: number,
): SavedMessage {
  return {
    id: input.id ?? createId("message"),
    threadId,
    sourceMessageId: input.sourceMessageId,
    sourceMessageKey: input.sourceMessageKey,
    contentHash: input.contentHash,
    role: input.role,
    title:
      normalizeMessageTitle(input.title) || getDefaultMessageTitle(input.contentMarkdown || input.contentText),
    contentMarkdown: input.contentMarkdown,
    contentText: input.contentText,
    prevId: null,
    nextId: null,
    createdAt: input.createdAt ?? timestamp,
    updatedAt: input.updatedAt ?? timestamp,
  };
}

function normalizeMessageTitle(title: string | null | undefined): string {
  return (title ?? "").replace(/\s+/g, " ").trim();
}

function getDefaultMessageTitle(markdown: string): string {
  const firstLine = markdown
    .replace(/\r\n/g, "\n")
    .split("\n")
    .find((line) => line.trim().length > 0)
    ?.trim();

  if (!firstLine) {
    return "Empty note";
  }

  return markdownToPlainText(firstLine) || firstLine || "Empty note";
}
