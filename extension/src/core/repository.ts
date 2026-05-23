import { notesDb } from "../storage/db";
import { getBlobContentHash, readImageDimensions, validateImageAsset } from "./assets";
import { contentHashFromParts, createId } from "./hash";
import { deleteExactTextFromMarkdown, markdownToPlainText } from "./markdown";
import type {
  AiOperationPackage,
  AiOperationProposal,
  AppSetting,
  AppendMessageInput,
  ChatGptThread,
  ChatGptThreadInput,
  NotebookAsset,
  NotebookFolder,
  NotebookFolderInput,
  NotebookInput,
  SaveChatGptMessageInput,
  SaveChatGptMessageResult,
  SavedMessage,
  StoredNotebookBackup,
  ThreadSource,
} from "./models";
import type { NotebookBackupSnapshot, RestoredNotebookBackupData } from "./notebookBackup";
import {
  getMessagesInOrder as orderMessages,
  insertMessageAfter as insertMessageAfterInOrder,
  insertMessageBySortOrder,
  moveMessageAfter as moveMessageAfterInOrder,
  renumberMessages,
} from "./messageOrder";

export type NotebookSnapshot = {
  thread: ChatGptThread;
  messages: SavedMessage[];
};

export type CreateImageAssetInput = {
  threadId: string;
  messageId: string | null;
  file: Blob;
  filename?: string | null;
  altText?: string | null;
};

export type NotebookBackupMergeResult = {
  folders: number;
  threads: number;
  messages: number;
  settings: number;
  aiOperationProposals: number;
  assets: number;
};

export type NotebookAutosaveMetadata = {
  dataRevision: number;
  lastBackupRevision: number;
  lastBackupAt: string | null;
  lastBackupError: string | null;
  lastDailyBackupDate: string | null;
};

export type StoredNotebookBackupInput = Omit<StoredNotebookBackup, "createdAt" | "updatedAt">;

export async function getAiOperationProposals(): Promise<AiOperationProposal[]> {
  return (await notesDb.aiOperationProposals.toArray()).sort((left, right) => left.createdAt - right.createdAt);
}

export async function getNotebookBackupSnapshot(): Promise<NotebookBackupSnapshot> {
  const [folders, threads, messages, settings, aiOperationProposals, assets] = await Promise.all([
    notesDb.folders.toArray(),
    notesDb.threads.toArray(),
    notesDb.messages.toArray(),
    notesDb.settings.toArray(),
    notesDb.aiOperationProposals.toArray(),
    notesDb.assets.toArray(),
  ]);

  return {
    folders: sortFolders(folders),
    threads: sortThreads(threads),
    messages,
    settings,
    aiOperationProposals: aiOperationProposals.sort((left, right) => left.createdAt - right.createdAt),
    assets,
  };
}

export async function recordNotebookDataMutation(): Promise<number> {
  return notesDb.transaction("rw", notesDb.settings, async () => {
    const currentRevision = await getNumericSettingInTransaction("dataRevision");
    const nextRevision = currentRevision + 1;

    await notesDb.settings.put({
      key: "dataRevision",
      value: String(nextRevision),
      updatedAt: Date.now(),
    });
    await notesDb.settings.delete("lastBackupError");

    return nextRevision;
  });
}

export async function getNotebookAutosaveMetadata(): Promise<NotebookAutosaveMetadata> {
  const settings = await notesDb.settings.bulkGet([
    "dataRevision",
    "lastBackupRevision",
    "lastBackupAt",
    "lastBackupError",
    "lastDailyBackupDate",
  ]);

  return {
    dataRevision: toSettingNumber(settings[0]?.value),
    lastBackupRevision: toSettingNumber(settings[1]?.value),
    lastBackupAt: settings[2]?.value ?? null,
    lastBackupError: settings[3]?.value ?? null,
    lastDailyBackupDate: settings[4]?.value ?? null,
  };
}

export async function markNotebookBackupSucceeded(input: {
  revision: number;
  backedUpAt: string;
  dailyBackupDate: string;
}): Promise<void> {
  const timestamp = Date.now();

  await notesDb.transaction("rw", notesDb.settings, async () => {
    await notesDb.settings.bulkPut([
      {
        key: "lastBackupRevision",
        value: String(input.revision),
        updatedAt: timestamp,
      },
      {
        key: "lastBackupAt",
        value: input.backedUpAt,
        updatedAt: timestamp,
      },
      {
        key: "lastDailyBackupDate",
        value: input.dailyBackupDate,
        updatedAt: timestamp,
      },
    ]);
    await notesDb.settings.delete("lastBackupError");
  });
}

export async function markNotebookBackupFailed(error: string): Promise<void> {
  await notesDb.settings.put({
    key: "lastBackupError",
    value: error,
    updatedAt: Date.now(),
  });
}

export async function saveStoredNotebookBackup(input: StoredNotebookBackupInput): Promise<StoredNotebookBackup> {
  const existing = await notesDb.storedBackups.get(input.id);
  const timestamp = Date.now();
  const storedBackup: StoredNotebookBackup = {
    ...input,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  await notesDb.storedBackups.put(storedBackup);
  return storedBackup;
}

export async function getStoredNotebookBackup(backupId: string): Promise<StoredNotebookBackup | null> {
  return (await notesDb.storedBackups.get(backupId)) ?? null;
}

export async function getStoredNotebookBackups(): Promise<StoredNotebookBackup[]> {
  return (await notesDb.storedBackups.toArray()).sort(compareStoredBackups);
}

export async function deleteStoredDailyBackupsBefore(cutoffDate: string): Promise<void> {
  const expired = await notesDb.storedBackups
    .where("kind")
    .equals("daily")
    .filter((backup) => backup.backupDate !== null && backup.backupDate < cutoffDate)
    .primaryKeys();

  if (expired.length > 0) {
    await notesDb.storedBackups.bulkDelete(expired);
  }
}

export async function mergeNotebookDataFromBackup(
  backup: RestoredNotebookBackupData,
): Promise<NotebookBackupMergeResult> {
  await notesDb.transaction(
    "rw",
    notesDb.folders,
    notesDb.threads,
    notesDb.messages,
    notesDb.settings,
    notesDb.aiOperationProposals,
    notesDb.assets,
    async () => {
      const existingThreads = await notesDb.threads.toArray();
      const existingMessages = await notesDb.messages.toArray();
      const existingThreadsById = new Map(existingThreads.map((thread) => [thread.id, thread]));
      const existingThreadsBySource = new Map(
        existingThreads.map((thread) => [getThreadSourceIdentityKey(thread), thread]),
      );
      const existingMessagesById = new Map(existingMessages.map((message) => [message.id, message]));
      const existingMessagesBySourceKey = new Map(
        existingMessages.map((message) => [getMessageSourceIdentityKey(message), message]),
      );
      const threadIdMap = new Map<string, string>();
      const threadById = new Map(existingThreads.map((thread) => [thread.id, { ...thread }]));

      for (const folder of backup.folders) {
        await notesDb.folders.put(folder);
      }

      for (const thread of backup.threads) {
        const existingThread =
          existingThreadsById.get(thread.id) ?? existingThreadsBySource.get(getThreadSourceIdentityKey(thread));
        const targetId = existingThread?.id ?? thread.id;
        const mergedThread: ChatGptThread = {
          ...thread,
          id: targetId,
          folderId: thread.folderId ?? null,
        };

        threadIdMap.set(thread.id, targetId);
        threadById.set(targetId, mergedThread);
      }

      const backupMessagesByTargetThreadId = new Map<string, SavedMessage[]>();
      const messageIdMap = new Map<string, string>();
      const incomingMessages: SavedMessage[] = [];

      for (const message of backup.messages) {
        const targetThreadId = threadIdMap.get(message.threadId) ?? message.threadId;
        const existingMessage =
          existingMessagesById.get(message.id) ??
          existingMessagesBySourceKey.get(`${targetThreadId}:${message.sourceMessageKey}`);
        const targetId = existingMessage?.id ?? message.id;
        const remappedMessage: SavedMessage = {
          ...message,
          id: targetId,
          threadId: targetThreadId,
        };

        messageIdMap.set(message.id, targetId);
        incomingMessages.push(remappedMessage);

        const targetMessages = backupMessagesByTargetThreadId.get(targetThreadId) ?? [];
        targetMessages.push(message);
        backupMessagesByTargetThreadId.set(targetThreadId, targetMessages);
      }

      const finalMessagesByThreadId = new Map<string, SavedMessage[]>();
      const incomingMessageById = new Map(incomingMessages.map((message) => [message.id, message]));
      const affectedThreadIds = new Set([
        ...incomingMessages.map((message) => message.threadId),
        ...backup.threads.map((thread) => threadIdMap.get(thread.id) ?? thread.id),
      ]);

      for (const threadId of affectedThreadIds) {
        const thread = threadById.get(threadId);

        if (!thread) {
          continue;
        }

        const existingThread = existingThreadsById.get(threadId);
        const existingThreadMessages = existingMessages.filter((message) => message.threadId === threadId);
        const existingOrderedMessages = existingThread
          ? getMessagesInBestEffortOrder(existingThread, existingThreadMessages)
          : [];
        const finalById = new Map(existingThreadMessages.map((message) => [message.id, { ...message }]));
        const orderedMessages: SavedMessage[] = [];
        const orderedMessageIds = new Set<string>();

        for (const message of existingOrderedMessages) {
          const finalMessage = incomingMessageById.get(message.id) ?? finalById.get(message.id) ?? message;
          orderedMessages.push(finalMessage);
          orderedMessageIds.add(finalMessage.id);
          finalById.set(finalMessage.id, finalMessage);
        }

        for (const message of incomingMessageById.values()) {
          if (message.threadId === threadId) {
            finalById.set(message.id, message);
          }
        }

        for (const backupThread of backup.threads.filter((candidate) => threadIdMap.get(candidate.id) === threadId)) {
          const backupOrderedMessages = getMessagesInBestEffortOrder(
            backupThread,
            backupMessagesByTargetThreadId.get(threadId)?.filter((message) => message.threadId === backupThread.id) ??
              [],
          );

          for (const backupMessage of backupOrderedMessages) {
            const targetMessageId = messageIdMap.get(backupMessage.id) ?? backupMessage.id;
            const finalMessage = finalById.get(targetMessageId);

            if (finalMessage && !orderedMessageIds.has(targetMessageId)) {
              orderedMessages.push(finalMessage);
              orderedMessageIds.add(targetMessageId);
            }
          }
        }

        for (const message of finalById.values()) {
          if (!orderedMessageIds.has(message.id)) {
            orderedMessages.push(message);
            orderedMessageIds.add(message.id);
          }
        }

        const rebuilt = rebuildThreadMessageOrder(thread, orderedMessages);
        threadById.set(threadId, rebuilt.thread);
        finalMessagesByThreadId.set(threadId, rebuilt.messages);
      }

      await notesDb.threads.bulkPut([...threadById.values()]);

      for (const [threadId, messages] of finalMessagesByThreadId) {
        const currentMessageIds = existingMessages
          .filter((message) => message.threadId === threadId)
          .map((message) => message.id);

        if (currentMessageIds.length > 0) {
          await notesDb.messages.bulkDelete(currentMessageIds);
        }

        if (messages.length > 0) {
          await notesDb.messages.bulkPut(messages);
        }
      }

      for (const setting of backup.settings) {
        await notesDb.settings.put({
          ...setting,
          value:
            setting.key === "activeSaveTargetThreadId" && setting.value
              ? threadIdMap.get(setting.value) ?? setting.value
              : setting.value,
        });
      }

      if (backup.aiOperationProposals.length > 0) {
        await notesDb.aiOperationProposals.bulkPut(backup.aiOperationProposals);
      }

      if (backup.assets.length > 0) {
        await notesDb.assets.bulkPut(
          backup.assets.map((asset) => ({
            ...asset,
            threadId: threadIdMap.get(asset.threadId) ?? asset.threadId,
            messageId: asset.messageId ? messageIdMap.get(asset.messageId) ?? asset.messageId : null,
          })),
        );
      }
    },
  );

  return {
    folders: backup.folders.length,
    threads: backup.threads.length,
    messages: backup.messages.length,
    settings: backup.settings.length,
    aiOperationProposals: backup.aiOperationProposals.length,
    assets: backup.assets.length,
  };
}

function compareStoredBackups(left: StoredNotebookBackup, right: StoredNotebookBackup): number {
  if (left.kind !== right.kind) {
    return left.kind === "latest" ? -1 : 1;
  }

  return (right.backupDate ?? right.exportedAt).localeCompare(left.backupDate ?? left.exportedAt);
}

export async function saveAiOperationProposal(operationPackage: AiOperationPackage): Promise<AiOperationProposal> {
  const timestamp = Date.now();
  const proposal: AiOperationProposal = {
    id: createId("ai-proposal"),
    sourceThreadId: operationPackage.sourceThreadId,
    sourceTitle: operationPackage.sourceTitle,
    package: operationPackage,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await notesDb.aiOperationProposals.add(proposal);
  return proposal;
}

export async function deleteAiOperationProposal(proposalId: string): Promise<void> {
  await notesDb.aiOperationProposals.delete(proposalId);
}

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

export async function getThreadBySource(
  sourceThreadId: string,
  source: Extract<ThreadSource, "chatgpt" | "deepwiki"> = "chatgpt",
): Promise<ChatGptThread | null> {
  return (
    (await notesDb.threads
      .where("[source+sourceThreadId]")
      .equals([source, sourceThreadId])
      .first()) ?? null
  );
}

export async function getOrCreateChatGptThread(input: ChatGptThreadInput): Promise<ChatGptThread> {
  return notesDb.transaction("rw", notesDb.threads, async () => {
    const existing = await notesDb.threads
      .where("[source+sourceThreadId]")
      .equals([input.source ?? "chatgpt", input.sourceThreadId])
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
      source: input.source ?? "chatgpt",
      sourceThreadId: input.sourceThreadId,
      title: input.title || getDefaultSourceThreadTitle(input.source ?? "chatgpt"),
      folderId: null,
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

export async function moveThreadAfterThread(
  threadId: string,
  afterThreadId: string | null,
): Promise<ChatGptThread[]> {
  return notesDb.transaction("rw", notesDb.threads, async () => {
    const threads = sortThreads(await notesDb.threads.toArray());
    const currentThread = threads.find((thread) => thread.id === threadId);

    if (!currentThread) {
      throw new Error(`Missing thread ${threadId}`);
    }

    if (afterThreadId === threadId) {
      return threads;
    }

    const currentFolderId = currentThread.folderId ?? null;
    const folderThreads = threads.filter((thread) => (thread.folderId ?? null) === currentFolderId);
    const targetThread = afterThreadId ? folderThreads.find((thread) => thread.id === afterThreadId) : null;

    if (afterThreadId && !targetThread) {
      throw new Error(`Missing target thread ${afterThreadId} in folder`);
    }

    const withoutCurrentThread = folderThreads.filter((thread) => thread.id !== threadId);
    const insertIndex = afterThreadId
      ? withoutCurrentThread.findIndex((thread) => thread.id === afterThreadId) + 1
      : 0;

    if (insertIndex < 0) {
      throw new Error(`Missing target thread ${afterThreadId} in folder`);
    }

    const reorderedFolderThreads = [
      ...withoutCurrentThread.slice(0, insertIndex),
      currentThread,
      ...withoutCurrentThread.slice(insertIndex),
    ];

    if (reorderedFolderThreads.every((thread, index) => thread.id === folderThreads[index]?.id)) {
      return threads;
    }

    const timestamp = Date.now();
    const sortOrders = folderThreads.map(getThreadSortOrder);
    const nextThreadById = new Map(
      reorderedFolderThreads.map((thread, index) => [
        thread.id,
        {
          ...thread,
          sortOrder: sortOrders[index],
          updatedAt: thread.id === threadId ? timestamp : thread.updatedAt,
        },
      ]),
    );
    const updatedThreads = threads.map((thread) => nextThreadById.get(thread.id) ?? thread);

    await notesDb.threads.bulkPut(updatedThreads);
    return sortThreads(updatedThreads);
  });
}

export async function deleteThread(threadId: string): Promise<void> {
  await notesDb.transaction("rw", notesDb.threads, notesDb.messages, notesDb.settings, notesDb.assets, async () => {
    const thread = await notesDb.threads.get(threadId);

    if (!thread) {
      return;
    }

    await notesDb.messages.where("threadId").equals(threadId).delete();
    await notesDb.assets.where("threadId").equals(threadId).delete();
    await notesDb.threads.delete(threadId);

    const activeSaveTarget = await notesDb.settings.get("activeSaveTargetThreadId");

    if (activeSaveTarget?.value === threadId) {
      const timestamp = Date.now();
      await notesDb.settings.bulkPut([
        {
          key: "activeSaveTargetThreadId",
          value: null,
          updatedAt: timestamp,
        },
        {
          key: "activeSaveTargetMessageId",
          value: null,
          updatedAt: timestamp,
        },
      ]);
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
      await notesDb.settings.bulkPut([
        {
          key: "activeSaveTargetThreadId",
          value: null,
          updatedAt: timestamp,
        },
        {
          key: "activeSaveTargetMessageId",
          value: null,
          updatedAt: timestamp,
        },
      ]);
      return null;
    }

    const thread = await notesDb.threads.get(threadId);

    if (!thread) {
      throw new Error(`Missing save target thread ${threadId}`);
    }

    await notesDb.settings.bulkPut([
      {
        key: "activeSaveTargetThreadId",
        value: threadId,
        updatedAt: timestamp,
      },
      {
        key: "activeSaveTargetMessageId",
        value: null,
        updatedAt: timestamp,
      },
    ]);

    return thread;
  });
}

export async function getActiveSaveTargetMessage(): Promise<SavedMessage | null> {
  const setting = await notesDb.settings.get("activeSaveTargetMessageId");

  if (!setting?.value) {
    return null;
  }

  const message = await notesDb.messages.get(setting.value);

  if (!message) {
    await notesDb.settings.delete("activeSaveTargetMessageId");
    return null;
  }

  return message;
}

export async function setActiveSaveTargetMessage(messageId: string | null): Promise<SavedMessage | null> {
  return notesDb.transaction("rw", notesDb.threads, notesDb.messages, notesDb.settings, async () => {
    const timestamp = Date.now();

    if (!messageId) {
      await notesDb.settings.put({
        key: "activeSaveTargetMessageId",
        value: null,
        updatedAt: timestamp,
      });
      return null;
    }

    const message = await notesDb.messages.get(messageId);

    if (!message) {
      throw new Error(`Missing save target message ${messageId}`);
    }

    const thread = await notesDb.threads.get(message.threadId);

    if (!thread) {
      throw new Error(`Missing save target thread ${message.threadId}`);
    }

    await notesDb.settings.bulkPut([
      {
        key: "activeSaveTargetThreadId",
        value: message.threadId,
        updatedAt: timestamp,
      },
      {
        key: "activeSaveTargetMessageId",
        value: message.id,
        updatedAt: timestamp,
      },
    ]);

    return message;
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

export async function createImageAsset(input: CreateImageAssetInput): Promise<NotebookAsset> {
  const validation = validateImageAsset(input.file);

  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const [contentHash, dimensions] = await Promise.all([
    getBlobContentHash(input.file),
    readImageDimensions(input.file),
  ]);
  const timestamp = Date.now();

  return notesDb.transaction("rw", notesDb.threads, notesDb.messages, notesDb.assets, async () => {
    const thread = await requireThread(input.threadId);

    if (input.messageId) {
      const message = await notesDb.messages.get(input.messageId);

      if (!message || message.threadId !== thread.id) {
        throw new Error(`Missing message ${input.messageId}`);
      }
    }

    const existing = await notesDb.assets
      .where("contentHash")
      .equals(contentHash)
      .and(
        (asset) =>
          asset.threadId === thread.id &&
          asset.messageId === input.messageId &&
          asset.mimeType === validation.mimeType,
      )
      .first();

    if (existing) {
      return existing;
    }

    const asset: NotebookAsset = {
      id: createId("asset"),
      threadId: thread.id,
      messageId: input.messageId,
      kind: "image",
      mimeType: validation.mimeType,
      filename: normalizeAssetFilename(input.filename),
      altText: normalizeAssetAltText(input.altText, input.filename),
      byteSize: input.file.size,
      width: dimensions?.width ?? null,
      height: dimensions?.height ?? null,
      contentHash,
      blob: input.file,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await notesDb.assets.add(asset);
    return asset;
  });
}

export async function getNotebookAsset(assetId: string): Promise<NotebookAsset | null> {
  return (await notesDb.assets.get(assetId)) ?? null;
}

export async function getAssetsForThread(threadId: string): Promise<NotebookAsset[]> {
  return notesDb.assets.where("threadId").equals(threadId).toArray();
}

export async function restoreNotebookSnapshot(snapshot: NotebookSnapshot): Promise<SavedMessage[]> {
  return notesDb.transaction("rw", notesDb.threads, notesDb.messages, async () => {
    const currentThread = await requireThread(snapshot.thread.id);
    const restoredMessageIds = new Set(snapshot.messages.map((message) => message.id));

    if (restoredMessageIds.size !== snapshot.messages.length) {
      throw new Error("Cannot restore notebook snapshot with duplicate messages");
    }

    const timestamp = Date.now();
    const restoredMessages = renumberMessages(snapshot.messages.map((message) => ({
      ...message,
      threadId: currentThread.id,
    })));
    const restoredThread: ChatGptThread = {
      ...currentThread,
      title: snapshot.thread.title,
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
    const source = input.source ?? "chatgpt";
    const thread = await getSaveTargetThreadInTransaction({
      source,
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
          title: thread.source === source ? input.title || thread.title : thread.title,
          updatedAt: timestamp,
        };

        await notesDb.messages.put(updatedMessage);
        await notesDb.threads.put(updatedThread);

        return { thread: updatedThread, message: updatedMessage, status: "updated" };
      }

      return { thread, message: existing, status: "already_saved" };
    }

    const activeSaveTargetMessage = await getActiveSaveTargetMessageInTransaction(thread.id);

    if (activeSaveTargetMessage) {
      const updatedMessage = appendExportToMessage(activeSaveTargetMessage, input, timestamp);
      const updatedThread = {
        ...thread,
        updatedAt: timestamp,
      };

      await notesDb.messages.put(updatedMessage);
      await notesDb.threads.put(updatedThread);

      return { thread: updatedThread, message: updatedMessage, status: "updated" };
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
  await notesDb.transaction("rw", notesDb.threads, notesDb.messages, notesDb.settings, async () => {
    const thread = await requireThread(threadId);
    const node = await notesDb.messages.get(messageId);

    if (!node || node.threadId !== threadId) {
      return;
    }

    const timestamp = Date.now();
    const messages = orderMessages(thread, await notesDb.messages.where("threadId").equals(threadId).toArray());
    const updatedMessages = renumberMessages(messages.filter((message) => message.id !== messageId));
    const updatedThread: ChatGptThread = {
      ...thread,
      messageCount: updatedMessages.length,
      updatedAt: timestamp,
    };

    if (updatedMessages.length > 0) {
      await notesDb.messages.bulkPut(updatedMessages);
    }

    await notesDb.messages.delete(messageId);
    await notesDb.threads.put(updatedThread);

    const activeSaveTargetMessage = await notesDb.settings.get("activeSaveTargetMessageId");

    if (activeSaveTargetMessage?.value === messageId) {
      await notesDb.settings.put({
        key: "activeSaveTargetMessageId",
        value: null,
        updatedAt: timestamp,
      });
    }
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
    const timestamp = Date.now();
    const restoredMessage: SavedMessage = {
      ...message,
      updatedAt: timestamp,
    };
    const orderedMessages = orderMessages(thread, messages);
    const updatedMessages = insertMessageBySortOrder(orderedMessages, restoredMessage);
    const updatedThread: ChatGptThread = {
      ...thread,
      messageCount: updatedMessages.length,
      updatedAt: timestamp,
    };

    await notesDb.messages.bulkPut(updatedMessages);
    await notesDb.threads.put(updatedThread);

    return updatedMessages.find((item) => item.id === restoredMessage.id) ?? restoredMessage;
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
    const timestamp = Date.now();
    const movedMessages = moveMessageAfterInOrder(orderedMessages, messageId, afterMessageId);
    const updatedThread: ChatGptThread = {
      ...thread,
      messageCount: movedMessages.length,
      updatedAt: timestamp,
    };
    const updatedMessages = movedMessages.map((message) =>
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

    const timestamp = Date.now();
    const movedMessages = moveMessageAfterInOrder(orderedMessages, messageId, afterMessageId);
    const updatedThread: ChatGptThread = {
      ...thread,
      messageCount: movedMessages.length,
      updatedAt: timestamp,
    };
    const updatedMessages = movedMessages.map((message) =>
      message.id === messageId ? { ...message, updatedAt: timestamp } : message,
    );

    await notesDb.messages.bulkPut(updatedMessages);
    await notesDb.threads.put(updatedThread);

    return orderMessages(updatedThread, updatedMessages);
  });
}

export async function mergeMessages(threadId: string, messageIds: string[]): Promise<SavedMessage | null> {
  return notesDb.transaction("rw", notesDb.threads, notesDb.messages, async () => {
    const thread = await requireThread(threadId);
    const selectedIds = new Set(messageIds);

    if (selectedIds.size < 2) {
      return null;
    }

    const messages = await notesDb.messages.where("threadId").equals(threadId).toArray();
    const orderedMessages = orderMessages(thread, messages);
    const selectedMessages = orderedMessages.filter((message) => selectedIds.has(message.id));

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
    const mergedMessages = renumberMessages(
      orderedMessages
        .filter((message) => !selectedIds.has(message.id) || message.id === primaryMessage.id)
        .map((message) => (message.id === primaryMessage.id ? mergedMessage : message)),
    );
    const deletedMessageIds = selectedMessages.slice(1).map((message) => message.id);

    if (deletedMessageIds.length > 0) {
      await notesDb.messages.bulkDelete(deletedMessageIds);
    }

    await notesDb.messages.bulkPut(mergedMessages);
    await notesDb.threads.put({ ...thread, messageCount: mergedMessages.length, updatedAt: timestamp });
    return mergedMessages.find((message) => message.id === mergedMessage.id) ?? mergedMessage;
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
  source: Extract<ThreadSource, "chatgpt" | "deepwiki"> = "chatgpt",
): Promise<Record<string, boolean>> {
  const states = Object.fromEntries(sourceMessageKeys.map((key) => [key, false]));
  const thread = (await getActiveSaveTargetThread()) ?? (await getThreadBySource(sourceThreadId, source));

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

async function getActiveSaveTargetMessageInTransaction(threadId: string): Promise<SavedMessage | null> {
  const setting = await notesDb.settings.get("activeSaveTargetMessageId");

  if (!setting?.value) {
    return null;
  }

  const message = await notesDb.messages.get(setting.value);

  if (!message) {
    await notesDb.settings.delete("activeSaveTargetMessageId");
    return null;
  }

  if (message.threadId !== threadId) {
    await notesDb.settings.delete("activeSaveTargetMessageId");
    return null;
  }

  return message;
}

function appendExportToMessage(
  message: SavedMessage,
  input: SaveChatGptMessageInput,
  timestamp: number,
): SavedMessage {
  const currentMarkdown = (message.contentMarkdown || message.contentText).replace(/\r\n/g, "\n").trim();
  const exportedMarkdown = input.contentMarkdown.replace(/\r\n/g, "\n").trim();
  const contentMarkdown = [currentMarkdown, exportedMarkdown].filter(Boolean).join("\n\n");
  const contentText = markdownToPlainText(contentMarkdown);

  return {
    ...message,
    contentMarkdown,
    contentText,
    contentHash: contentHashFromParts({ contentMarkdown, contentText }),
    updatedAt: timestamp,
  };
}

async function getOrCreateThreadInTransaction(input: ChatGptThreadInput): Promise<ChatGptThread> {
  const source = input.source ?? "chatgpt";
  const existing = await notesDb.threads
    .where("[source+sourceThreadId]")
    .equals([source, input.sourceThreadId])
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
    source,
    sourceThreadId: input.sourceThreadId,
    title: input.title || getDefaultSourceThreadTitle(source),
    folderId: null,
    messageCount: 0,
    sortOrder: await getNextThreadSortOrderInTransaction(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await notesDb.threads.add(thread);
  return thread;
}

function getDefaultSourceThreadTitle(source: Extract<ThreadSource, "chatgpt" | "deepwiki">): string {
  return source === "deepwiki" ? "Untitled DeepWiki page" : "Untitled ChatGPT conversation";
}

function getThreadSourceIdentityKey(thread: Pick<ChatGptThread, "source" | "sourceThreadId">): string {
  return `${thread.source}:${thread.sourceThreadId}`;
}

function getMessageSourceIdentityKey(message: Pick<SavedMessage, "threadId" | "sourceMessageKey">): string {
  return `${message.threadId}:${message.sourceMessageKey}`;
}

function getMessagesInBestEffortOrder(thread: ChatGptThread, messages: SavedMessage[]): SavedMessage[] {
  if (messages.length === 0) {
    return [];
  }

  try {
    return orderMessages(thread, messages);
  } catch {
    return [...messages].sort((left, right) => left.createdAt - right.createdAt);
  }
}

function rebuildThreadMessageOrder(
  thread: ChatGptThread,
  messages: SavedMessage[],
): { thread: ChatGptThread; messages: SavedMessage[] } {
  const rebuiltMessages = renumberMessages(messages);

  return {
    thread: {
      ...thread,
      messageCount: rebuiltMessages.length,
      updatedAt: Math.max(thread.updatedAt, ...rebuiltMessages.map((message) => message.updatedAt), 0),
    },
    messages: rebuiltMessages,
  };
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

async function getNumericSettingInTransaction(key: AppSetting["key"]): Promise<number> {
  const setting = await notesDb.settings.get(key);
  return toSettingNumber(setting?.value);
}

function toSettingNumber(value: string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function appendMessageInTransaction(
  thread: ChatGptThread,
  message: SavedMessage,
  timestamp: number,
): Promise<ChatGptThread> {
  const messages = orderMessages(thread, await notesDb.messages.where("threadId").equals(thread.id).toArray());
  const updatedMessages = renumberMessages([...messages, message]);
  const updatedThread: ChatGptThread = {
    ...thread,
    messageCount: updatedMessages.length,
    updatedAt: timestamp,
  };
  const storedMessage = updatedMessages.find((item) => item.id === message.id);

  if (storedMessage) {
    Object.assign(message, storedMessage);
  }

  await notesDb.messages.bulkPut(updatedMessages);
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

  const messages = orderMessages(thread, await notesDb.messages.where("threadId").equals(thread.id).toArray());
  const updatedMessages = insertMessageAfterInOrder(messages, message, afterMessageId);
  const updatedThread: ChatGptThread = {
    ...thread,
    messageCount: updatedMessages.length,
    updatedAt: timestamp,
  };
  const storedMessage = updatedMessages.find((item) => item.id === message.id);

  if (storedMessage) {
    Object.assign(message, storedMessage);
  }

  await notesDb.messages.bulkPut(updatedMessages);
  await notesDb.threads.put(updatedThread);
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
    sortOrder: 0,
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

function normalizeAssetFilename(filename: string | null | undefined): string | null {
  const normalized = filename?.trim().replace(/[\\/:*?"<>|]+/g, "-").slice(0, 180) ?? "";
  return normalized || null;
}

function normalizeAssetAltText(altText: string | null | undefined, filename: string | null | undefined): string {
  const normalized = altText?.replace(/\s+/g, " ").trim();

  if (normalized) {
    return normalized.slice(0, 180);
  }

  const filenameLabel = filename?.trim().replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ");
  return filenameLabel ? filenameLabel.slice(0, 180) : "Inserted image";
}
