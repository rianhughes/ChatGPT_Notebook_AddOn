import { stableHash } from "./hash";
import type {
  AiOperationProposal,
  AppSetting,
  AppSettingKey,
  ChatGptThread,
  NotebookAsset,
  NotebookFolder,
  SavedMessage,
} from "./models";
import type { NotebookBackupSnapshot, RestoredNotebookBackupData, RestoredNotebookAsset } from "./notebookBackup";

const CLOUD_BACKUP_APP_ID = "chatgpt-notes-sidebar";
export const CLOUD_BACKUP_VERSION = 2;

const CLOUD_EXCLUDED_SETTING_KEYS = new Set<AppSettingKey>([
  "lastCloudBackupRevision",
  "lastCloudBackupAt",
  "lastCloudBackupError",
]);

export type CloudBackupAsset = Omit<NotebookAsset, "blob"> & {
  objectPath: string;
};

export type CloudBackupData = {
  app: typeof CLOUD_BACKUP_APP_ID;
  backupVersion: typeof CLOUD_BACKUP_VERSION;
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
  assets: CloudBackupAsset[];
};

export type CloudBackupFile = {
  filename: string;
  mimeType: string;
  contents: string;
};

export type CloudBackupManifest = {
  id: string;
  user_id: string;
  kind: "latest" | "daily" | "manual";
  backup_date: string | null;
  data_revision: number;
  backup_version: typeof CLOUD_BACKUP_VERSION;
  snapshot_path: string;
  snapshot_sha256: string;
  byte_size: number;
  asset_count: number;
  encrypted: boolean;
  compression: "none";
  exported_at: string;
  created_at?: string;
};

export type CloudBackupListItem = {
  id: string;
  kind: "latest" | "daily" | "manual";
  backupDate: string | null;
  dataRevision: number;
  exportedAt: string;
  byteSize: number;
  assetCount: number;
};

export function createCloudBackupData(
  snapshot: NotebookBackupSnapshot,
  options: { userId: string; now?: number | Date; dataRevision?: number },
): CloudBackupData {
  const assets = snapshot.assets.map((asset) => ({
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
    objectPath: getCloudAssetObjectPath(options.userId, asset),
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  }));
  const settings = snapshot.settings.filter((setting) => !CLOUD_EXCLUDED_SETTING_KEYS.has(setting.key));

  return {
    app: CLOUD_BACKUP_APP_ID,
    backupVersion: CLOUD_BACKUP_VERSION,
    exportedAt: toIsoString(options.now ?? Date.now()),
    dataRevision: options.dataRevision ?? getSnapshotDataRevision(snapshot),
    counts: {
      folders: snapshot.folders.length,
      threads: snapshot.threads.length,
      messages: snapshot.messages.length,
      settings: settings.length,
      aiOperationProposals: snapshot.aiOperationProposals.length,
      assets: assets.length,
    },
    folders: snapshot.folders,
    threads: snapshot.threads,
    messages: snapshot.messages,
    settings,
    aiOperationProposals: snapshot.aiOperationProposals,
    assets,
  };
}

export function createCloudBackupFile(data: CloudBackupData): CloudBackupFile {
  return {
    filename: `chatgpt-notes-cloud-backup-${data.exportedAt.slice(0, 10)}.json`,
    mimeType: "application/json",
    contents: `${JSON.stringify(data, null, 2)}\n`,
  };
}

export function createCloudBackupManifests(input: {
  userId: string;
  data: CloudBackupData;
  snapshotPath: string;
  snapshotSha256: string;
  byteSize: number;
}): CloudBackupManifest[] {
  const backupDate = input.data.exportedAt.slice(0, 10);
  const common = {
    user_id: input.userId,
    data_revision: input.data.dataRevision,
    backup_version: CLOUD_BACKUP_VERSION as typeof CLOUD_BACKUP_VERSION,
    snapshot_path: input.snapshotPath,
    snapshot_sha256: input.snapshotSha256,
    byte_size: input.byteSize,
    asset_count: input.data.assets.length,
    encrypted: false,
    compression: "none" as const,
    exported_at: input.data.exportedAt,
  };

  return [
    {
      id: getLatestCloudBackupId(input.userId),
      kind: "latest",
      backup_date: null,
      ...common,
    },
    {
      id: getDailyCloudBackupId(input.userId, backupDate),
      kind: "daily",
      backup_date: backupDate,
      ...common,
    },
  ];
}

export function parseCloudBackupJson(json: string): CloudBackupData {
  const parsed = JSON.parse(json) as Partial<CloudBackupData>;

  if (parsed.app !== CLOUD_BACKUP_APP_ID || parsed.backupVersion !== CLOUD_BACKUP_VERSION) {
    throw new Error("Unsupported ChatGPT Notebook cloud backup file.");
  }

  assertArray(parsed.folders, "folders");
  assertArray(parsed.threads, "threads");
  assertArray(parsed.messages, "messages");
  assertArray(parsed.settings, "settings");
  assertArray(parsed.aiOperationProposals, "aiOperationProposals");
  assertArray(parsed.assets, "assets");

  return {
    app: CLOUD_BACKUP_APP_ID,
    backupVersion: CLOUD_BACKUP_VERSION,
    exportedAt: typeof parsed.exportedAt === "string" ? parsed.exportedAt : toIsoString(Date.now()),
    dataRevision: typeof parsed.dataRevision === "number" ? parsed.dataRevision : 0,
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
    assets: parsed.assets as CloudBackupAsset[],
  };
}

export function restoreCloudBackupData(
  data: CloudBackupData,
  assetBlobsById: Map<string, Blob>,
): RestoredNotebookBackupData {
  const assets: RestoredNotebookAsset[] = data.assets.map((asset) => {
    const blob = assetBlobsById.get(asset.id);

    if (!blob) {
      throw new Error(`Cloud backup is missing image asset ${asset.id}.`);
    }

    return {
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
      blob,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    };
  });

  return {
    app: CLOUD_BACKUP_APP_ID,
    backupVersion: 1,
    exportedAt: data.exportedAt,
    dataRevision: data.dataRevision,
    counts: data.counts,
    folders: data.folders,
    threads: data.threads,
    messages: data.messages,
    settings: data.settings,
    aiOperationProposals: data.aiOperationProposals,
    assets,
  };
}

export function getCloudAssetObjectPath(userId: string, asset: Pick<NotebookAsset, "contentHash" | "mimeType">): string {
  return `${getCloudUserPathPrefix(userId)}/assets/${asset.contentHash}.${getImageExtension(asset.mimeType)}`;
}

export function getCloudSnapshotObjectPath(userId: string, data: Pick<CloudBackupData, "dataRevision" | "exportedAt">): string {
  const timestamp = data.exportedAt.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return `${getCloudUserPathPrefix(userId)}/snapshots/rev-${data.dataRevision}-${timestamp}.json`;
}

export function getCloudLatestSnapshotObjectPath(userId: string): string {
  return `${getCloudUserPathPrefix(userId)}/snapshots/latest.json`;
}

export function getLatestCloudBackupId(userId: string): string {
  return `${getCloudUserPathPrefix(userId)}:latest`;
}

export function getDailyCloudBackupId(userId: string, backupDate: string): string {
  return `${getCloudUserPathPrefix(userId)}:daily:${backupDate}`;
}

export function toCloudBackupListItem(row: CloudBackupManifest): CloudBackupListItem {
  return {
    id: row.id,
    kind: row.kind,
    backupDate: row.backup_date,
    dataRevision: row.data_revision,
    exportedAt: row.exported_at,
    byteSize: row.byte_size,
    assetCount: row.asset_count,
  };
}

export async function sha256Text(value: string): Promise<string> {
  if (globalThis.crypto?.subtle) {
    const encoded = new TextEncoder().encode(value);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  return stableHash(value);
}

function getCloudUserPathPrefix(userId: string): string {
  if (!/^[A-Za-z0-9_-]+$/.test(userId)) {
    throw new Error("Supabase user id is not safe for a storage path.");
  }

  return userId;
}

function getImageExtension(mimeType: string): string {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/png":
    default:
      return "png";
  }
}

function getSnapshotDataRevision(snapshot: NotebookBackupSnapshot): number {
  const revision = snapshot.settings.find((setting) => setting.key === "dataRevision")?.value;
  const parsedRevision = revision ? Number.parseInt(revision, 10) : 0;
  return Number.isFinite(parsedRevision) ? parsedRevision : 0;
}

function toIsoString(value: number | Date): string {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

function assertArray(value: unknown, field: string): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Cloud backup is missing ${field}.`);
  }
}
