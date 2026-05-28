import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createCloudBackupData,
  createCloudBackupFile,
  createCloudBackupManifests,
  getCloudLatestSnapshotObjectPath,
  getCloudSnapshotObjectPath,
  parseCloudBackupJson,
  restoreCloudBackupData,
  sha256Text,
  toCloudBackupListItem,
  type CloudBackupAsset,
  type CloudBackupManifest,
} from "../core/cloudBackup";
import type { NotebookBackupSnapshot } from "../core/notebookBackup";
import type {
  CloudBackupListResponse,
  CloudBackupStatusResponse,
  DeleteCloudBackupsResponse,
  RestoreCloudBackupResponse,
} from "../core/ports";
import {
  clearCloudBackupMetadata,
  getNotebookBackupSnapshot,
  getNotebookCloudBackupMetadata,
  markCloudBackupFailed,
  markCloudBackupSucceeded,
  mergeNotebookDataFromBackup,
} from "../core/repository";
import { getCloudAuthStatus } from "./cloudAuth";
import { getSupabaseClient, getSupabaseCloudConfig, getSupabaseSession } from "./cloudSupabase";

const CLOUD_BACKUP_DELAY_MS = 1_500;
const CLOUD_BACKUP_RETRY_INITIAL_MS = 15_000;
const CLOUD_BACKUP_RETRY_MAX_MS = 5 * 60_000;

let cloudBackupTimer: ReturnType<typeof setTimeout> | null = null;
let uploadInProgress = false;
let dirtyWhileUploading = false;
let transientState: "pending" | "uploading" | "error" | null = null;
let retryDelayMs = CLOUD_BACKUP_RETRY_INITIAL_MS;

export async function queueCloudBackup(): Promise<void> {
  const status = await getCloudAuthStatus();

  if (!status.configured || !status.signedIn) {
    return;
  }

  transientState = "pending";
  scheduleCloudBackup();
}

export async function forceCloudBackup(): Promise<CloudBackupStatusResponse> {
  if (cloudBackupTimer) {
    clearTimeout(cloudBackupTimer);
    cloudBackupTimer = null;
  }

  await flushCloudBackup();
  return getCloudBackupStatus();
}

export async function getCloudBackupStatus(): Promise<CloudBackupStatusResponse> {
  const status = await getCloudAuthStatus();

  if (!status.configured || !status.signedIn) {
    return status;
  }

  if (transientState === "uploading") {
    return { ...status, state: "uploading" };
  }

  if (status.lastCloudBackupError && status.dataRevision > status.lastCloudBackupRevision) {
    return { ...status, state: "error" };
  }

  if (transientState === "pending" || status.dataRevision > status.lastCloudBackupRevision) {
    return { ...status, state: "pending" };
  }

  return { ...status, state: "idle" };
}

export async function listCloudBackups(): Promise<CloudBackupListResponse> {
  const { supabase, config, userId } = await requireCloudSession();
  const { data, error } = await supabase
    .from(config.backupTable)
    .select("id, user_id, kind, backup_date, data_revision, backup_version, snapshot_path, snapshot_sha256, byte_size, asset_count, encrypted, compression, exported_at")
    .eq("user_id", userId)
    .order("exported_at", { ascending: false })
    .limit(20);

  if (error) {
    throw error;
  }

  return {
    backups: ((data ?? []) as CloudBackupManifest[]).map(toCloudBackupListItem),
  };
}

export async function restoreCloudBackup(backupId: string): Promise<RestoreCloudBackupResponse> {
  try {
    const { supabase, config, userId } = await requireCloudSession();
    const { data: row, error } = await supabase
      .from(config.backupTable)
      .select("id, user_id, kind, backup_date, data_revision, backup_version, snapshot_path, snapshot_sha256, byte_size, asset_count, encrypted, compression, exported_at")
      .eq("id", backupId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!row) {
      throw new Error("Cloud backup was not found.");
    }

    const manifest = row as CloudBackupManifest;
    const snapshotBlob = await downloadCloudObject(supabase, config.backupBucket, manifest.snapshot_path);
    const snapshotJson = await readBlobText(snapshotBlob);
    const actualHash = await sha256Text(snapshotJson);

    if (actualHash !== manifest.snapshot_sha256) {
      throw new Error("Cloud backup checksum does not match.");
    }

    const cloudData = parseCloudBackupJson(snapshotJson);
    const assetBlobs = new Map<string, Blob>();

    for (const asset of cloudData.assets) {
      assetBlobs.set(asset.id, await downloadCloudObject(supabase, config.backupBucket, asset.objectPath));
    }

    const restored = restoreCloudBackupData(cloudData, assetBlobs);
    const counts = await mergeNotebookDataFromBackup(restored);

    return {
      restored: true,
      backupId,
      counts,
    };
  } catch (error) {
    return {
      restored: false,
      error: error instanceof Error ? error.message : "Could not restore cloud backup.",
    };
  }
}

export async function deleteCloudBackups(): Promise<DeleteCloudBackupsResponse> {
  try {
    if (uploadInProgress) {
      throw new Error("Wait for the current cloud backup upload to finish before deleting backups.");
    }

    const { supabase, config, userId } = await requireCloudSession();
    const objectPaths = await listUserBackupObjectPaths(supabase, config.backupBucket, userId);

    if (objectPaths.length > 0) {
      const { error: removeError } = await supabase.storage.from(config.backupBucket).remove(objectPaths);

      if (removeError) {
        throw removeError;
      }
    }

    const { error: deleteError } = await supabase.from(config.backupTable).delete().eq("user_id", userId);

    if (deleteError) {
      throw deleteError;
    }

    await clearCloudBackupMetadata();
    if (cloudBackupTimer) {
      clearTimeout(cloudBackupTimer);
      cloudBackupTimer = null;
    }
    dirtyWhileUploading = false;
    retryDelayMs = CLOUD_BACKUP_RETRY_INITIAL_MS;
    transientState = null;

    return {
      deleted: true,
      objectsDeleted: objectPaths.length,
    };
  } catch (error) {
    return {
      deleted: false,
      error: error instanceof Error ? error.message : "Could not delete cloud backups.",
    };
  }
}

function scheduleCloudBackup(delayMs = CLOUD_BACKUP_DELAY_MS): void {
  if (cloudBackupTimer) {
    clearTimeout(cloudBackupTimer);
  }

  cloudBackupTimer = setTimeout(() => {
    cloudBackupTimer = null;
    void flushCloudBackup();
  }, delayMs);
}

async function flushCloudBackup(): Promise<void> {
  if (uploadInProgress) {
    dirtyWhileUploading = true;
    return;
  }

  const sessionContext = await getCloudSession();

  if (!sessionContext) {
    transientState = null;
    return;
  }

  uploadInProgress = true;
  transientState = "uploading";

  try {
    const metadata = await getNotebookCloudBackupMetadata();

    if (metadata.dataRevision <= metadata.lastCloudBackupRevision) {
      transientState = null;
      return;
    }

    const snapshot = await getNotebookBackupSnapshot();
    const cloudData = createCloudBackupData(snapshot, {
      userId: sessionContext.userId,
      dataRevision: metadata.dataRevision,
    });
    const file = createCloudBackupFile(cloudData);
    const snapshotPath = getCloudSnapshotObjectPath(sessionContext.userId, cloudData);
    const latestPath = getCloudLatestSnapshotObjectPath(sessionContext.userId);
    const snapshotSha256 = await sha256Text(file.contents);

    await uploadCloudAssets(sessionContext.supabase, sessionContext.config.backupBucket, snapshot, cloudData.assets);
    await uploadCloudJson(sessionContext.supabase, sessionContext.config.backupBucket, snapshotPath, file.contents);
    await uploadCloudJson(sessionContext.supabase, sessionContext.config.backupBucket, latestPath, file.contents);

    const manifests = createCloudBackupManifests({
      userId: sessionContext.userId,
      data: cloudData,
      snapshotPath,
      snapshotSha256,
      byteSize: new Blob([file.contents], { type: file.mimeType }).size,
    });
    const { error } = await sessionContext.supabase
      .from(sessionContext.config.backupTable)
      .upsert(manifests, { onConflict: "id" });

    if (error) {
      throw error;
    }

    await markCloudBackupSucceeded({
      revision: cloudData.dataRevision,
      backedUpAt: cloudData.exportedAt,
    });
    retryDelayMs = CLOUD_BACKUP_RETRY_INITIAL_MS;
    transientState = null;
  } catch (error) {
    transientState = "error";
    await markCloudBackupFailed(error instanceof Error ? error.message : "Cloud backup failed.");
  } finally {
    uploadInProgress = false;

    const metadata = await getNotebookCloudBackupMetadata();

    if (dirtyWhileUploading || metadata.dataRevision > metadata.lastCloudBackupRevision) {
      const hadUploadError = transientState === "error";

      dirtyWhileUploading = false;
      transientState = "pending";
      scheduleCloudBackup(hadUploadError ? retryDelayMs : CLOUD_BACKUP_DELAY_MS);

      if (hadUploadError) {
        retryDelayMs = Math.min(retryDelayMs * 2, CLOUD_BACKUP_RETRY_MAX_MS);
      }
    }
  }
}

async function uploadCloudAssets(
  supabase: SupabaseClient,
  bucket: string,
  snapshot: NotebookBackupSnapshot,
  cloudAssets: Pick<CloudBackupAsset, "id" | "objectPath" | "mimeType">[],
): Promise<void> {
  const localAssets = new Map(snapshot.assets.map((asset) => [asset.id, asset]));

  for (const cloudAsset of cloudAssets) {
    const asset = localAssets.get(cloudAsset.id);

    if (!asset) {
      throw new Error(`Missing local image asset ${cloudAsset.id}.`);
    }

    const { error } = await supabase.storage.from(bucket).upload(cloudAsset.objectPath, asset.blob, {
      contentType: asset.mimeType,
      upsert: true,
    });

    if (error) {
      throw error;
    }
  }
}

async function uploadCloudJson(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  contents: string,
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).upload(
    path,
    new Blob([contents], { type: "application/json" }),
    {
      contentType: "application/json",
      upsert: true,
    },
  );

  if (error) {
    throw error;
  }
}

async function downloadCloudObject(supabase: SupabaseClient, bucket: string, path: string): Promise<Blob> {
  const { data, error } = await supabase.storage.from(bucket).download(path);

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(`Cloud backup object is missing: ${path}`);
  }

  return data;
}

async function listUserBackupObjectPaths(
  supabase: SupabaseClient,
  bucket: string,
  userId: string,
): Promise<string[]> {
  const prefixes = [`${userId}/snapshots`, `${userId}/assets`];
  const objectPaths: string[] = [];

  for (const prefix of prefixes) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: 1000,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      throw error;
    }

    for (const object of data ?? []) {
      if (object.name) {
        objectPaths.push(`${prefix}/${object.name}`);
      }
    }
  }

  return objectPaths;
}

async function getCloudSession(): Promise<Awaited<ReturnType<typeof requireCloudSession>> | null> {
  try {
    return await requireCloudSession();
  } catch {
    return null;
  }
}

async function requireCloudSession(): Promise<{
  supabase: SupabaseClient;
  config: NonNullable<ReturnType<typeof getSupabaseCloudConfig>>;
  userId: string;
}> {
  const supabase = getSupabaseClient();
  const config = getSupabaseCloudConfig();

  if (!supabase || !config) {
    throw new Error("Supabase cloud backup is not configured.");
  }

  const session = await getSupabaseSession();
  const userId = session?.user.id;

  if (!session || !userId) {
    throw new Error("Sign in with Google before using cloud backup.");
  }

  return { supabase, config, userId };
}

async function readBlobText(blob: Blob): Promise<string> {
  if (typeof blob.text === "function") {
    return blob.text();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(reader.error ?? new Error("Could not read cloud backup."));
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Could not read cloud backup."));
    };
    reader.readAsText(blob);
  });
}
