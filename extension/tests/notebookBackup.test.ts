import { describe, expect, it } from "vitest";

import type {
  AiOperationProposal,
  AppSetting,
  ChatGptThread,
  NotebookAsset,
  NotebookFolder,
  SavedMessage,
} from "../src/core/models";
import {
  createNotebookBackupData,
  createNotebookBackupFile,
  parseNotebookBackupJson,
  parseNotebookImportJson,
} from "../src/core/notebookBackup";
import { createNotebookExportData, createNotebookExportFile } from "../src/core/notebookExport";

describe("notebook backup", () => {
  it("creates a full self-contained JSON backup", async () => {
    const data = await createNotebookBackupData(
      {
        folders: [folder()],
        threads: [thread()],
        messages: [message()],
        settings: [setting()],
        aiOperationProposals: [aiOperationProposal()],
        assets: [asset()],
      },
      { now: Date.UTC(2026, 4, 22, 9, 30, 0) },
    );
    const file = createNotebookBackupFile(data);
    const parsed = JSON.parse(file.contents);

    expect(file.filename).toBe("chatgpt-notes-backup-2026-05-22.json");
    expect(file.mimeType).toBe("application/json");
    expect(parsed).toMatchObject({
      app: "chatgpt-notes-sidebar",
      backupVersion: 1,
      exportedAt: "2026-05-22T09:30:00.000Z",
      counts: {
        folders: 1,
        threads: 1,
        messages: 1,
        settings: 1,
        aiOperationProposals: 1,
        assets: 1,
      },
      threads: [{ id: "thread-1", title: "Research Notes" }],
      messages: [{ id: "message-1", contentMarkdown: "Markdown" }],
      assets: [{ id: "asset-1", contentBase64: "AQID" }],
    });
  });

  it("parses assets back into blobs for restore", async () => {
    const data = await createNotebookBackupData(
      {
        folders: [],
        threads: [thread()],
        messages: [message()],
        settings: [],
        aiOperationProposals: [],
        assets: [asset()],
      },
      { now: Date.UTC(2026, 4, 22, 9, 30, 0) },
    );
    const restored = await parseNotebookBackupJson(createNotebookBackupFile(data).contents);

    expect(restored.assets).toHaveLength(1);
    expect(restored.assets[0].blob.type).toBe("image/png");
    expect([...new Uint8Array(await readBlob(restored.assets[0].blob))]).toEqual([1, 2, 3]);
  });

  it("imports a single-notebook JSON export as mergeable backup data", async () => {
    const exportData = createNotebookExportData(thread(), [message()], {
      now: Date.UTC(2026, 4, 22, 9, 30, 0),
    });
    const restored = await parseNotebookImportJson(createNotebookExportFile(exportData, "json").contents);

    expect(restored.counts).toMatchObject({ folders: 0, threads: 1, messages: 1, settings: 0 });
    expect(restored.threads[0]).toMatchObject({
      id: "thread-1",
      title: "Research Notes",
      headMessageId: "message-1",
      tailMessageId: "message-1",
      messageCount: 1,
    });
    expect(restored.messages[0]).toMatchObject({
      id: "message-1",
      threadId: "thread-1",
      sourceMessageKey: "source-key",
      contentMarkdown: "Markdown",
      prevId: null,
      nextId: null,
    });
  });
});

function readBlob(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === "function") {
    return blob.arrayBuffer();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(reader.error ?? new Error("Could not read blob."));
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
        return;
      }

      reject(new Error("Could not read blob."));
    };
    reader.readAsArrayBuffer(blob);
  });
}

function folder(): NotebookFolder {
  return {
    id: "folder-1",
    title: "Work",
    sortOrder: 0,
    createdAt: Date.UTC(2026, 4, 21, 8, 0, 0),
    updatedAt: Date.UTC(2026, 4, 21, 8, 0, 0),
  };
}

function thread(): ChatGptThread {
  return {
    id: "thread-1",
    source: "chatgpt",
    sourceThreadId: "conversation-1",
    title: "Research Notes",
    folderId: "folder-1",
    headMessageId: "message-1",
    tailMessageId: "message-1",
    messageCount: 1,
    sortOrder: 0,
    createdAt: Date.UTC(2026, 4, 21, 8, 0, 0),
    updatedAt: Date.UTC(2026, 4, 21, 8, 0, 0),
  };
}

function message(): SavedMessage {
  return {
    id: "message-1",
    threadId: "thread-1",
    sourceMessageId: "source-message",
    sourceMessageKey: "source-key",
    contentHash: "hash",
    role: "assistant",
    title: "Markdown",
    contentMarkdown: "Markdown",
    contentText: "Markdown",
    prevId: null,
    nextId: null,
    createdAt: Date.UTC(2026, 4, 21, 8, 0, 0),
    updatedAt: Date.UTC(2026, 4, 21, 8, 0, 0),
  };
}

function setting(): AppSetting {
  return {
    key: "activeSaveTargetThreadId",
    value: "thread-1",
    updatedAt: Date.UTC(2026, 4, 21, 8, 0, 0),
  };
}

function aiOperationProposal(): AiOperationProposal {
  return {
    id: "proposal-1",
    sourceThreadId: "conversation-1",
    sourceTitle: "Research",
    package: {
      protocolVersion: 1,
      requestId: "request-1",
      sourceThreadId: "conversation-1",
      sourceTitle: "Research",
      operations: [],
    },
    createdAt: Date.UTC(2026, 4, 21, 8, 0, 0),
    updatedAt: Date.UTC(2026, 4, 21, 8, 0, 0),
  };
}

function asset(): NotebookAsset {
  return {
    id: "asset-1",
    threadId: "thread-1",
    messageId: "message-1",
    kind: "image",
    mimeType: "image/png",
    filename: "diagram.png",
    altText: "diagram",
    byteSize: 3,
    width: 10,
    height: 20,
    contentHash: "image-hash",
    blob: new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }),
    createdAt: Date.UTC(2026, 4, 21, 8, 0, 0),
    updatedAt: Date.UTC(2026, 4, 21, 8, 0, 0),
  };
}
