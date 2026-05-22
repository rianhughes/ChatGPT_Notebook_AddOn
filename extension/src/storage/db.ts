import Dexie, { type Table } from "dexie";

import type {
  AiOperationProposal,
  AppSetting,
  ChatGptThread,
  NotebookAsset,
  StoredNotebookBackup,
  NotebookFolder,
  SavedMessage,
} from "../core/models";

export class NotesDatabase extends Dexie {
  threads!: Table<ChatGptThread, string>;
  messages!: Table<SavedMessage, string>;
  settings!: Table<AppSetting, string>;
  folders!: Table<NotebookFolder, string>;
  aiOperationProposals!: Table<AiOperationProposal, string>;
  assets!: Table<NotebookAsset, string>;
  storedBackups!: Table<StoredNotebookBackup, string>;

  constructor() {
    super("chatgpt-notes-sidebar");

    this.version(7).stores({
      threads: "&id, &[source+sourceThreadId], folderId, updatedAt",
      messages: "&id, threadId, &[threadId+sourceMessageKey], sourceMessageId, [threadId+sortOrder], sortOrder, updatedAt",
      settings: "&key, updatedAt",
      folders: "&id, sortOrder, updatedAt",
      aiOperationProposals: "&id, sourceThreadId, createdAt, updatedAt",
      assets: "&id, threadId, messageId, contentHash, updatedAt",
      storedBackups: "&id, kind, backupDate, updatedAt",
    });
  }
}

export const notesDb = new NotesDatabase();

export async function resetDatabaseForTests(): Promise<void> {
  await notesDb.delete();
  await notesDb.open();
}
