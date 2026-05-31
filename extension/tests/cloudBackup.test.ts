import { describe, expect, it } from "vitest";

import {
  createCloudBackupData,
  createCloudBackupFile,
  createCloudBackupManifests,
  getCloudAssetObjectPath,
  getCloudLatestSnapshotObjectPath,
  getCloudSnapshotObjectPath,
  parseCloudBackupJson,
  restoreCloudBackupData,
} from "../src/core/cloudBackup";
import type {
  AiOperationProposal,
  AppSetting,
  ChatGptThread,
  NotebookAsset,
  NotebookFolder,
  SavedMessage,
} from "../src/core/models";

describe("cloud backup", () => {
  it("creates a JSON snapshot that references image objects instead of embedding base64", () => {
    const data = createCloudBackupData(
      {
        folders: [folder()],
        threads: [thread()],
        messages: [message()],
        settings: [setting(), cloudSetting()],
        aiOperationProposals: [aiOperationProposal()],
        assets: [asset()],
      },
      {
        userId: "user-123",
        now: Date.UTC(2026, 4, 28, 9, 30, 0),
        dataRevision: 42,
      },
    );
    const file = createCloudBackupFile(data);
    const parsed = JSON.parse(file.contents);

    expect(parsed).toMatchObject({
      app: "chatgpt-notes-sidebar",
      backupVersion: 2,
      exportedAt: "2026-05-28T09:30:00.000Z",
      dataRevision: 42,
      counts: {
        folders: 1,
        threads: 1,
        messages: 1,
        settings: 1,
        aiOperationProposals: 1,
        assets: 1,
      },
      assets: [
        {
          id: "asset-1",
          objectPath: "user-123/assets/image-hash.png",
        },
      ],
    });
    expect(parsed.assets[0].contentBase64).toBeUndefined();
    expect(parsed.settings).toEqual([{ key: "dataRevision", value: "42", updatedAt: Date.UTC(2026, 4, 21, 8, 0, 0) }]);
  });

  it("rehydrates cloud snapshots with downloaded image blobs for the existing merge path", async () => {
    const cloudData = parseCloudBackupJson(
      createCloudBackupFile(
        createCloudBackupData(
          {
            folders: [folder()],
            threads: [thread()],
            messages: [message()],
            settings: [],
            aiOperationProposals: [],
            assets: [asset()],
          },
          { userId: "user-123" },
        ),
      ).contents,
    );
    const restored = restoreCloudBackupData(
      cloudData,
      new Map([["asset-1", new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" })]]),
    );

    expect(restored.backupVersion).toBe(1);
    expect(restored.assets).toHaveLength(1);
    expect(restored.assets[0].blob.type).toBe("image/png");
    expect([...new Uint8Array(await readBlob(restored.assets[0].blob))]).toEqual([1, 2, 3]);
  });

  it("uses content-addressed asset paths with image extensions", () => {
    expect(getCloudAssetObjectPath("user-123", { contentHash: "abc", mimeType: "image/png" })).toBe(
      "user-123/assets/abc.png",
    );
    expect(getCloudAssetObjectPath("user-123", { contentHash: "abc", mimeType: "image/jpeg" })).toBe(
      "user-123/assets/abc.jpg",
    );
  });

  it("builds encrypted snapshot paths and manifest metadata", () => {
    const data = createCloudBackupData(
      {
        folders: [folder()],
        threads: [thread()],
        messages: [message()],
        settings: [],
        aiOperationProposals: [],
        assets: [asset()],
      },
      {
        userId: "user-123",
        now: Date.UTC(2026, 4, 31, 12, 0, 0),
        dataRevision: 99,
        encryption: {
          enabled: true,
          version: 1,
          keyVersion: 3,
          scheme: "aes-256-gcm+a256kw+pbkdf2-sha256",
        },
      },
    );
    const snapshotPath = getCloudSnapshotObjectPath("user-123", data, { encrypted: true });
    const latestPath = getCloudLatestSnapshotObjectPath("user-123", { encrypted: true });
    const manifests = createCloudBackupManifests({
      userId: "user-123",
      data,
      snapshotPath,
      snapshotSha256: "cipher-sha256",
      byteSize: 1234,
      encryption: {
        keyVersion: 3,
        snapshotIvB64: "iv",
        snapshotWrappedDekB64: "wrapped",
        snapshotAad: "aad",
        plaintextSha256: "plain-sha",
      },
    });

    expect(data.assets[0]?.objectPath.endsWith(".enc")).toBe(true);
    expect(snapshotPath.endsWith(".json.enc")).toBe(true);
    expect(latestPath.endsWith(".enc")).toBe(true);
    expect(manifests[0]).toMatchObject({
      encrypted: true,
      encryption_version: 1,
      key_version: 3,
      snapshot_iv_b64: "iv",
      snapshot_wrapped_dek_b64: "wrapped",
      snapshot_aad: "aad",
      plaintext_sha256: "plain-sha",
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
    sortOrder: 0,
    createdAt: Date.UTC(2026, 4, 21, 8, 0, 0),
    updatedAt: Date.UTC(2026, 4, 21, 8, 0, 0),
  };
}

function setting(): AppSetting {
  return {
    key: "dataRevision",
    value: "42",
    updatedAt: Date.UTC(2026, 4, 21, 8, 0, 0),
  };
}

function cloudSetting(): AppSetting {
  return {
    key: "lastCloudBackupRevision",
    value: "41",
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
