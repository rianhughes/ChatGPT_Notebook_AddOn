import { notesDb } from "../storage/db";
import { contentHashFromParts, createId } from "./hash";
import { deleteExactTextFromMarkdown, markdownToPlainText } from "./markdown";
import type {
  AppendMessageInput,
  ChatGptThread,
  ChatGptThreadInput,
  NotebookInput,
  SaveChatGptMessageInput,
  SaveChatGptMessageResult,
  SavedMessage,
} from "./models";
import { getMessagesInOrder as orderMessages, moveMessageAfter } from "./linkedList";

export async function getThreads(): Promise<ChatGptThread[]> {
  const threads = await notesDb.threads.toArray();
  return sortThreads(threads);
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
  return notesDb.transaction("rw", notesDb.threads, async () => {
    const timestamp = Date.now();
    const id = createId("thread");
    const thread: ChatGptThread = {
      id,
      source: "notebook",
      sourceThreadId: `notebook:${id}`,
      title: input.title.trim() || "Untitled notebook",
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

export type ThreadMoveDirection = "up" | "down";

export async function reorderThread(
  threadId: string,
  direction: ThreadMoveDirection,
): Promise<ChatGptThread[]> {
  return notesDb.transaction("rw", notesDb.threads, async () => {
    const threads = sortThreads(await notesDb.threads.toArray());
    const currentIndex = threads.findIndex((thread) => thread.id === threadId);

    if (currentIndex === -1) {
      throw new Error(`Missing thread ${threadId}`);
    }

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= threads.length) {
      return threads;
    }

    const reordered = [...threads];
    [reordered[currentIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[currentIndex]];

    const updatedThreads = reordered.map((thread, index) => ({
      ...thread,
      sortOrder: index,
    }));

    await notesDb.threads.bulkPut(updatedThreads);
    return updatedThreads;
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

function getThreadSortOrder(thread: ChatGptThread): number {
  return typeof thread.sortOrder === "number" ? thread.sortOrder : -thread.updatedAt;
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
