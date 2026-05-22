import type {
  AiOperationProposal,
  AppSetting,
  ChatGptThread,
  NotebookAsset,
  NotebookFolder,
  SavedMessage,
} from "./models";
import { renumberMessages } from "./messageOrder";
import type { NotebookExportData } from "./notebookExport";

const BACKUP_APP_ID = "chatgpt-notes-sidebar";
const BACKUP_VERSION = 1;

export type NotebookBackupAsset = Omit<NotebookAsset, "blob"> & {
  contentBase64: string;
};

export type NotebookBackupData = {
  app: typeof BACKUP_APP_ID;
  backupVersion: typeof BACKUP_VERSION;
  exportedAt: string;
  dataRevision: number;
  counts: {
    folders: number;
    threads: number;
    messages: number;
    settings: number;
    aiOperationProposals: number;
    assets: number;
  };
  folders: NotebookFolder[];
  threads: ChatGptThread[];
  messages: SavedMessage[];
  settings: AppSetting[];
  aiOperationProposals: AiOperationProposal[];
  assets: NotebookBackupAsset[];
};

export type NotebookBackupSnapshot = {
  folders: NotebookFolder[];
  threads: ChatGptThread[];
  messages: SavedMessage[];
  settings: AppSetting[];
  aiOperationProposals: AiOperationProposal[];
  assets: NotebookAsset[];
};

export type NotebookBackupFile = {
  filename: string;
  mimeType: string;
  contents: string;
};

export type RestoredNotebookAsset = Omit<NotebookAsset, "blob"> & {
  blob: Blob;
};

export type RestoredNotebookBackupData = Omit<NotebookBackupData, "assets"> & {
  assets: RestoredNotebookAsset[];
};

export async function createNotebookBackupData(
  snapshot: NotebookBackupSnapshot,
  options: { now?: number | Date; dataRevision?: number } = {},
): Promise<NotebookBackupData> {
  const assets = await Promise.all(
    snapshot.assets.map(async (asset) => ({
      id: asset.id,
      threadId: asset.threadId,
      messageId: asset.messageId,
      kind: asset.kind,
      mimeType: asset.mimeType,
      filename: asset.filename,
      altText: asset.altText,
      byteSize: asset.byteSize,
      width: asset.width,
      height: asset.height,
      contentHash: asset.contentHash,
      contentBase64: await blobToBase64(asset.blob),
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    })),
  );

  return {
    app: BACKUP_APP_ID,
    backupVersion: BACKUP_VERSION,
    exportedAt: toIsoString(options.now ?? Date.now()),
    dataRevision: options.dataRevision ?? getSnapshotDataRevision(snapshot),
    counts: {
      folders: snapshot.folders.length,
      threads: snapshot.threads.length,
      messages: snapshot.messages.length,
      settings: snapshot.settings.length,
      aiOperationProposals: snapshot.aiOperationProposals.length,
      assets: snapshot.assets.length,
    },
    folders: snapshot.folders,
    threads: snapshot.threads,
    messages: snapshot.messages,
    settings: snapshot.settings,
    aiOperationProposals: snapshot.aiOperationProposals,
    assets,
  };
}

export function createNotebookBackupFile(data: NotebookBackupData): NotebookBackupFile {
  return {
    filename: `chatgpt-notes-backup-${data.exportedAt.slice(0, 10)}.json`,
    mimeType: "application/json",
    contents: `${JSON.stringify(data, null, 2)}\n`,
  };
}

export async function parseNotebookImportFile(file: File): Promise<RestoredNotebookBackupData> {
  return parseNotebookImportJson(await readTextFile(file));
}

export async function parseNotebookBackupFile(file: File): Promise<RestoredNotebookBackupData> {
  return parseNotebookBackupJson(await readTextFile(file));
}

export async function parseNotebookImportJson(json: string): Promise<RestoredNotebookBackupData> {
  const parsed = JSON.parse(json) as Partial<NotebookBackupData> & Partial<NotebookExportData>;

  if (parsed.app === BACKUP_APP_ID && parsed.backupVersion === BACKUP_VERSION) {
    return restoreNotebookBackupData(parsed as Partial<NotebookBackupData>);
  }

  if (parsed.app === BACKUP_APP_ID && parsed.exportVersion === 2) {
    return restoreNotebookExportData(parsed as NotebookExportData);
  }

  throw new Error("Unsupported ChatGPT Notebook import file.");
}

export async function parseNotebookBackupJson(json: string): Promise<RestoredNotebookBackupData> {
  const parsed = JSON.parse(json) as Partial<NotebookBackupData>;

  if (parsed.app !== BACKUP_APP_ID || parsed.backupVersion !== BACKUP_VERSION) {
    throw new Error("Unsupported ChatGPT Notebook backup file.");
  }

  return restoreNotebookBackupData(parsed);
}

async function restoreNotebookBackupData(
  parsed: Partial<NotebookBackupData>,
): Promise<RestoredNotebookBackupData> {
  assertArray(parsed.folders, "folders");
  assertArray(parsed.threads, "threads");
  assertArray(parsed.messages, "messages");
  assertArray(parsed.settings, "settings");
  assertArray(parsed.aiOperationProposals, "aiOperationProposals");
  assertArray(parsed.assets, "assets");

  return {
    app: BACKUP_APP_ID,
    backupVersion: BACKUP_VERSION,
    exportedAt: typeof parsed.exportedAt === "string" ? parsed.exportedAt : toIsoString(Date.now()),
    dataRevision: typeof parsed.dataRevision === "number" ? parsed.dataRevision : getParsedDataRevision(parsed),
    counts: {
      folders: parsed.folders.length,
      threads: parsed.threads.length,
      messages: parsed.messages.length,
      settings: parsed.settings.length,
      aiOperationProposals: parsed.aiOperationProposals.length,
      assets: parsed.assets.length,
    },
    folders: parsed.folders as NotebookFolder[],
    threads: parsed.threads as ChatGptThread[],
    messages: parsed.messages as SavedMessage[],
    settings: parsed.settings as AppSetting[],
    aiOperationProposals: parsed.aiOperationProposals as AiOperationProposal[],
    assets: await Promise.all(
      (parsed.assets as NotebookBackupAsset[]).map(async (asset) => ({
        id: asset.id,
        threadId: asset.threadId,
        messageId: asset.messageId,
        kind: asset.kind,
        mimeType: asset.mimeType,
        filename: asset.filename,
        altText: asset.altText,
        byteSize: asset.byteSize,
        width: asset.width,
        height: asset.height,
        contentHash: asset.contentHash,
        blob: base64ToBlob(asset.contentBase64, asset.mimeType),
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt,
      })),
    ),
  };
}

async function restoreNotebookExportData(data: NotebookExportData): Promise<RestoredNotebookBackupData> {
  assertArray(data.messages, "messages");
  assertArray(data.assets, "assets");

  const messages = [...data.messages].sort((left, right) => left.position - right.position);
  const restoredMessages = renumberMessages(messages.map((message) => ({
    id: message.id,
    threadId: data.thread.id,
    sourceMessageId: message.sourceMessageId,
    sourceMessageKey: message.sourceMessageKey,
    contentHash: message.contentHash,
    role: message.role,
    title: null,
    contentMarkdown: message.contentMarkdown,
    contentText: message.contentText,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  })));
  const restoredThread: ChatGptThread = {
    id: data.thread.id,
    source: data.thread.source,
    sourceThreadId: data.thread.sourceThreadId,
    title: data.thread.title,
    folderId: null,
    messageCount: restoredMessages.length,
    createdAt: data.thread.createdAt,
    updatedAt: data.thread.updatedAt,
  };
  const restoredAssets: RestoredNotebookAsset[] = data.assets.map((asset) => ({
    id: asset.id,
    threadId: asset.threadId,
    messageId: asset.messageId,
    kind: asset.kind,
    mimeType: asset.mimeType,
    filename: asset.filename,
    altText: asset.altText,
    byteSize: asset.byteSize,
    width: asset.width,
    height: asset.height,
    contentHash: asset.contentHash,
    blob: base64ToBlob(asset.contentBase64, asset.mimeType),
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  }));

  return {
    app: BACKUP_APP_ID,
    backupVersion: BACKUP_VERSION,
    exportedAt: data.exportedAt,
    dataRevision: 0,
    counts: {
      folders: 0,
      threads: 1,
      messages: restoredMessages.length,
      settings: 0,
      aiOperationProposals: 0,
      assets: restoredAssets.length,
    },
    folders: [],
    threads: [restoredThread],
    messages: restoredMessages,
    settings: [],
    aiOperationProposals: [],
    assets: restoredAssets,
  };
}

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blobToArrayBuffer(blob));
  let binary = "";

  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.slice(index, index + 0x8000));
  }

  return btoa(binary);
}

function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === "function") {
    return blob.arrayBuffer();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(reader.error ?? new Error("Could not read backup asset."));
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
        return;
      }

      reject(new Error("Could not read backup asset."));
    };
    reader.readAsArrayBuffer(blob);
  });
}

function base64ToBlob(contentBase64: string, mimeType: string): Blob {
  const binary = atob(contentBase64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

function readTextFile(file: File): Promise<string> {
  if (typeof file.text === "function") {
    return file.text();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(reader.error ?? new Error("Could not read import file."));
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Could not read import file."));
    };
    reader.readAsText(file);
  });
}

function assertArray(value: unknown, name: string): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Backup file is missing ${name}.`);
  }
}

function toIsoString(value: number | Date): string {
  return new Date(value).toISOString();
}

function getSnapshotDataRevision(snapshot: NotebookBackupSnapshot): number {
  const revision = Number(snapshot.settings.find((setting) => setting.key === "dataRevision")?.value ?? 0);
  return Number.isFinite(revision) ? revision : 0;
}

function getParsedDataRevision(parsed: Partial<NotebookBackupData>): number {
  const revision = Number(parsed.settings?.find((setting) => setting.key === "dataRevision")?.value ?? 0);
  return Number.isFinite(revision) ? revision : 0;
}
