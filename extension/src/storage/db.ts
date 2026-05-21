import Dexie, { type Table } from "dexie";

import type { AppSetting, ChatGptThread, SavedMessage } from "../core/models";

export class NotesDatabase extends Dexie {
  threads!: Table<ChatGptThread, string>;
  messages!: Table<SavedMessage, string>;
  settings!: Table<AppSetting, string>;

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
  }
}

export const notesDb = new NotesDatabase();

export async function resetDatabaseForTests(): Promise<void> {
  await notesDb.delete();
  await notesDb.open();
}
