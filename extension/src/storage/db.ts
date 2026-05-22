import Dexie, { type Table } from "dexie";

import type {
  AiOperationProposal,
  AppSetting,
  ChatGptThread,
  NotebookFolder,
  SavedMessage,
} from "../core/models";

export class NotesDatabase extends Dexie {
  threads!: Table<ChatGptThread, string>;
  messages!: Table<SavedMessage, string>;
  settings!: Table<AppSetting, string>;
  folders!: Table<NotebookFolder, string>;
  aiOperationProposals!: Table<AiOperationProposal, string>;

  constructor() {
    super("chatgpt-notes-sidebar");

    this.version(1).stores({
      threads: "&id, &[source+sourceThreadId], updatedAt",
      messages: "&id, threadId, &[threadId+sourceMessageKey], sourceMessageId, prevId, nextId, updatedAt",
    });

    this.version(2).stores({
      threads: "&id, &[source+sourceThreadId], updatedAt",
      messages: "&id, threadId, &[threadId+sourceMessageKey], sourceMessageId, prevId, nextId, updatedAt",
      settings: "&key, updatedAt",
    });

    this.version(3).stores({
      threads: "&id, &[source+sourceThreadId], folderId, updatedAt",
      messages: "&id, threadId, &[threadId+sourceMessageKey], sourceMessageId, prevId, nextId, updatedAt",
      settings: "&key, updatedAt",
      folders: "&id, sortOrder, updatedAt",
    });

    this.version(4).stores({
      threads: "&id, &[source+sourceThreadId], folderId, updatedAt",
      messages: "&id, threadId, &[threadId+sourceMessageKey], sourceMessageId, prevId, nextId, updatedAt",
      settings: "&key, updatedAt",
      folders: "&id, sortOrder, updatedAt",
      aiOperationProposals: "&id, sourceThreadId, createdAt, updatedAt",
    });
  }
}

export const notesDb = new NotesDatabase();

export async function resetDatabaseForTests(): Promise<void> {
  await notesDb.delete();
  await notesDb.open();
}
