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
  type CloudBackupData,
  type CloudBackupManifest,
} from "../core/cloudBackup";
import {
  CLOUD_ENCRYPTION_SCHEME,
  CLOUD_ENCRYPTION_VERSION,
  base64ToBytes,
  bytesToBase64,
  createDataKeyBytes,
  decryptBytesWithDataKey,
  decryptTextWithDataKey,
  encryptBytesWithDataKey,
  encryptTextWithDataKey,
  importAesKwKeyFromRaw,
  unwrapRawKeyBytes,
  wrapRawKeyBytes,
} from "../core/cryptoCloud";
import type { NotebookBackupSnapshot } from "../core/notebookBackup";
import type {
  CloudBackupListResponse,
  CloudBackupStatusResponse,
  DeleteCloudBackupsResponse,
  RestoreCloudBackupResponse,
} from "../core/ports";
import {
  clearCloudBackupMetadata,
  clearCloudLastDecryptError,
  getNotebookBackupSnapshot,
  getNotebookCloudBackupMetadata,
  markCloudBackupFailed,
  markCloudLastDecryptError,
  markCloudBackupSucceeded,
  mergeNotebookDataFromBackup,
} from "../core/repository";
import { getCloudAuthStatus } from "./cloudAuth";
import { getUnlockedMasterKeyForUser } from "./cloudKeyring";
import { getSupabaseClient, getSupabaseCloudConfig, getSupabaseSession } from "./cloudSupabase";

const CLOUD_BACKUP_DELAY_MS = 1_500;
const CLOUD_BACKUP_RETRY_INITIAL_MS = 15_000;
const CLOUD_BACKUP_RETRY_MAX_MS = 5 * 60_000;
const ENCRYPTED_CONTENT_TYPE = "application/octet-stream";
const CLOUD_STORAGE_REMOVE_BATCH_SIZE = 100;

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

  if (status.state === "locked") {
    return { ...status, state: "locked" };
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
    .select(
      "id, user_id, kind, backup_date, data_revision, backup_version, snapshot_path, snapshot_sha256, byte_size, asset_count, encrypted, encryption_version, key_version, snapshot_iv_b64, snapshot_wrapped_dek_b64, snapshot_aad, plaintext_sha256, compression, exported_at",
    )
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
  let encryptedRestoreAttempt = false;

  try {
    const { supabase, config, userId } = await requireCloudSession();
    const { data: row, error } = await supabase
      .from(config.backupTable)
      .select(
        "id, user_id, kind, backup_date, data_revision, backup_version, snapshot_path, snapshot_sha256, byte_size, asset_count, encrypted, encryption_version, key_version, snapshot_iv_b64, snapshot_wrapped_dek_b64, snapshot_aad, plaintext_sha256, compression, exported_at",
      )
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
    encryptedRestoreAttempt = manifest.encrypted;
    const snapshotBlob = await downloadCloudObject(supabase, config.backupBucket, manifest.snapshot_path);
    const snapshotBytes = await readBlobBytes(snapshotBlob);
    const actualSnapshotHash = await sha256Bytes(snapshotBytes);

    if (actualSnapshotHash !== manifest.snapshot_sha256) {
      throw new Error("Cloud backup checksum does not match.");
    }

    const cloudData = manifest.encrypted
      ? await decryptCloudSnapshot({
          manifest,
          snapshotBytes,
          userId,
        })
      : parseCloudBackupJson(await readBlobText(snapshotBlob));
    const assetBlobs = new Map<string, Blob>();

    if (manifest.encrypted) {
      const masterKey = await getUnlockedMasterKeyForUser(userId, manifest.key_version || undefined);

      if (!masterKey) {
        throw new Error("Unlock encrypted cloud sync before restoring this backup.");
      }

      const masterWrapKey = await importAesKwKeyFromRaw(masterKey, ["unwrapKey"]);

      for (const asset of cloudData.assets) {
        const assetBlob = await downloadCloudObject(supabase, config.backupBucket, asset.objectPath);

        if (!asset.encrypted) {
          assetBlobs.set(asset.id, assetBlob);
          continue;
        }

        if (!asset.ivB64 || !asset.wrappedDekB64 || !asset.aad) {
          throw new Error(`Encrypted cloud asset ${asset.id} is missing metadata.`);
        }

        const assetCiphertext = await readBlobBytes(assetBlob);
        const assetDek = await unwrapRawKeyBytes(masterWrapKey, base64ToBytes(asset.wrappedDekB64));
        const assetPlaintext = await decryptBytesWithDataKey({
          ciphertext: assetCiphertext,
          iv: base64ToBytes(asset.ivB64),
          dataKey: assetDek,
          aad: asset.aad,
        });
        assetBlobs.set(asset.id, new Blob([assetPlaintext], { type: asset.mimeType }));
      }
    } else {
      for (const asset of cloudData.assets) {
        assetBlobs.set(asset.id, await downloadCloudObject(supabase, config.backupBucket, asset.objectPath));
      }
    }

    const restored = restoreCloudBackupData(cloudData, assetBlobs);
    const counts = await mergeNotebookDataFromBackup(restored);

    if (manifest.encrypted) {
      await clearCloudLastDecryptError();
    }

    return {
      restored: true,
      backupId,
      counts,
    };
  } catch (error) {
    if (encryptedRestoreAttempt) {
      await markCloudLastDecryptError(error instanceof Error ? error.message : "Could not decrypt cloud backup.");
    }

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

    const cloudStatus = await getCloudAuthStatus();
    const cloudEncryptionEnabled = cloudStatus.cloudEncryptionEnabled;

    if (!cloudEncryptionEnabled || cloudStatus.cloudEncryptionLocked) {
      transientState = null;
      return;
    }

    const snapshot = await getNotebookBackupSnapshot();
    const keyVersion = cloudStatus.cloudKeyVersion || metadata.cloudKeyVersion || 1;
    const masterKey = await getUnlockedMasterKeyForUser(sessionContext.userId, keyVersion || undefined);

    if (!masterKey) {
      transientState = null;
      return;
    }

    const cloudData = createCloudBackupData(snapshot, {
      userId: sessionContext.userId,
      dataRevision: metadata.dataRevision,
      encryption: {
        enabled: true,
        version: CLOUD_ENCRYPTION_VERSION,
        keyVersion,
        scheme: CLOUD_ENCRYPTION_SCHEME,
      },
    });
    const masterWrapKey = await importAesKwKeyFromRaw(masterKey, ["wrapKey"]);
    await uploadEncryptedCloudAssets({
      supabase: sessionContext.supabase,
      bucket: sessionContext.config.backupBucket,
      snapshot,
      cloudData,
      masterWrapKey,
      userId: sessionContext.userId,
    });

    const file = createCloudBackupFile(cloudData);
    const snapshotPath = getCloudSnapshotObjectPath(sessionContext.userId, cloudData, { encrypted: true });
    const latestPath = getCloudLatestSnapshotObjectPath(sessionContext.userId, { encrypted: true });
    const snapshotDek = createDataKeyBytes();
    const snapshotAad = createCloudAad({
      userId: sessionContext.userId,
      objectPath: snapshotPath,
      dataRevision: cloudData.dataRevision,
    });
    const encryptedSnapshot = await encryptTextWithDataKey({
      plaintext: file.contents,
      dataKey: snapshotDek,
      aad: snapshotAad,
    });
    const wrappedSnapshotDek = await wrapRawKeyBytes(masterWrapKey, snapshotDek);
    const encryptedSnapshotBlob = new Blob([encryptedSnapshot.ciphertext], { type: ENCRYPTED_CONTENT_TYPE });
    const snapshotSha256 = await sha256Bytes(encryptedSnapshot.ciphertext);

    await uploadCloudBlob(
      sessionContext.supabase,
      sessionContext.config.backupBucket,
      snapshotPath,
      encryptedSnapshotBlob,
      ENCRYPTED_CONTENT_TYPE,
    );
    await uploadCloudBlob(
      sessionContext.supabase,
      sessionContext.config.backupBucket,
      latestPath,
      encryptedSnapshotBlob,
      ENCRYPTED_CONTENT_TYPE,
    );

    const manifests = createCloudBackupManifests({
      userId: sessionContext.userId,
      data: cloudData,
      snapshotPath,
      snapshotSha256,
      byteSize: encryptedSnapshotBlob.size,
      encryption: {
        keyVersion,
        snapshotIvB64: bytesToBase64(encryptedSnapshot.iv),
        snapshotWrappedDekB64: bytesToBase64(wrappedSnapshotDek),
        snapshotAad,
        plaintextSha256: await sha256Text(file.contents),
      },
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

    try {
      await cleanupLegacyPlaintextCloudData({
        supabase: sessionContext.supabase,
        config: sessionContext.config,
        userId: sessionContext.userId,
      });
    } catch {
      // Keep the encrypted backup successful even if plaintext cleanup must retry later.
    }

    retryDelayMs = CLOUD_BACKUP_RETRY_INITIAL_MS;
    transientState = null;
  } catch (error) {
    transientState = "error";
    await markCloudBackupFailed(error instanceof Error ? error.message : "Cloud backup failed.");
  } finally {
    uploadInProgress = false;

    const metadata = await getNotebookCloudBackupMetadata();
    const latestCloudStatus = await getCloudAuthStatus();
    const cloudLocked =
      latestCloudStatus.configured &&
      latestCloudStatus.signedIn &&
      latestCloudStatus.cloudEncryptionEnabled &&
      latestCloudStatus.cloudEncryptionLocked;

    if (!cloudLocked && (dirtyWhileUploading || metadata.dataRevision > metadata.lastCloudBackupRevision)) {
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

async function uploadEncryptedCloudAssets(input: {
  supabase: SupabaseClient;
  bucket: string;
  snapshot: NotebookBackupSnapshot;
  cloudData: CloudBackupData;
  masterWrapKey: CryptoKey;
  userId: string;
}): Promise<void> {
  const localAssets = new Map(input.snapshot.assets.map((asset) => [asset.id, asset]));

  for (const cloudAsset of input.cloudData.assets) {
    const asset = localAssets.get(cloudAsset.id);

    if (!asset) {
      throw new Error(`Missing local image asset ${cloudAsset.id}.`);
    }

    const assetPlaintext = await readBlobBytes(asset.blob);
    const assetDek = createDataKeyBytes();
    const assetAad = createCloudAad({
      userId: input.userId,
      objectPath: cloudAsset.objectPath,
      dataRevision: input.cloudData.dataRevision,
    });
    const encryptedAsset = await encryptBytesWithDataKey({
      plaintext: assetPlaintext,
      dataKey: assetDek,
      aad: assetAad,
    });
    const wrappedAssetDek = await wrapRawKeyBytes(input.masterWrapKey, assetDek);

    cloudAsset.encrypted = true;
    cloudAsset.encryptionVersion = CLOUD_ENCRYPTION_VERSION;
    cloudAsset.keyVersion = input.cloudData.encryption?.keyVersion ?? undefined;
    cloudAsset.ivB64 = bytesToBase64(encryptedAsset.iv);
    cloudAsset.wrappedDekB64 = bytesToBase64(wrappedAssetDek);
    cloudAsset.aad = assetAad;
    cloudAsset.plaintextSha256 = await sha256Bytes(assetPlaintext);

    await uploadCloudBlob(
      input.supabase,
      input.bucket,
      cloudAsset.objectPath,
      new Blob([encryptedAsset.ciphertext], { type: ENCRYPTED_CONTENT_TYPE }),
      ENCRYPTED_CONTENT_TYPE,
    );
  }
}

async function uploadCloudBlob(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  payload: Blob,
  contentType: string,
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).upload(path, payload, {
    contentType,
    upsert: true,
  });

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

async function decryptCloudSnapshot(input: {
  manifest: CloudBackupManifest;
  snapshotBytes: Uint8Array;
  userId: string;
}): Promise<CloudBackupData> {
  if (!input.manifest.snapshot_iv_b64 || !input.manifest.snapshot_wrapped_dek_b64 || !input.manifest.snapshot_aad) {
    throw new Error("Encrypted cloud snapshot metadata is incomplete.");
  }

  const masterKey = await getUnlockedMasterKeyForUser(input.userId, input.manifest.key_version || undefined);

  if (!masterKey) {
    throw new Error("Unlock encrypted cloud sync before restoring this backup.");
  }

  const masterWrapKey = await importAesKwKeyFromRaw(masterKey, ["unwrapKey"]);
  const snapshotDek = await unwrapRawKeyBytes(masterWrapKey, base64ToBytes(input.manifest.snapshot_wrapped_dek_b64));
  const snapshotPlaintext = await decryptTextWithDataKey({
    ciphertext: input.snapshotBytes,
    iv: base64ToBytes(input.manifest.snapshot_iv_b64),
    dataKey: snapshotDek,
    aad: input.manifest.snapshot_aad,
  });

  if (input.manifest.plaintext_sha256) {
    const plaintextHash = await sha256Text(snapshotPlaintext);

    if (plaintextHash !== input.manifest.plaintext_sha256) {
      throw new Error("Encrypted cloud snapshot checksum does not match.");
    }
  }

  return parseCloudBackupJson(snapshotPlaintext);
}

function createCloudAad(input: { userId: string; objectPath: string; dataRevision: number }): string {
  return `cgpt-notebook|enc-v${CLOUD_ENCRYPTION_VERSION}|${input.userId}|${input.objectPath}|${input.dataRevision}`;
}

async function listUserBackupObjectPaths(
  supabase: SupabaseClient,
  bucket: string,
  userId: string,
): Promise<string[]> {
  const prefixes = [`${userId}/snapshots`, `${userId}/assets`];
  const objectPaths: string[] = [];
  const pageSize = 1000;

  for (const prefix of prefixes) {
    let offset = 0;

    while (true) {
      const { data, error } = await supabase.storage.from(bucket).list(prefix, {
        limit: pageSize,
        offset,
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

      if (!data || data.length < pageSize) {
        break;
      }

      offset += pageSize;
    }
  }

  return objectPaths;
}

async function cleanupLegacyPlaintextCloudData(input: {
  supabase: SupabaseClient;
  config: NonNullable<ReturnType<typeof getSupabaseCloudConfig>>;
  userId: string;
}): Promise<void> {
  const objectPaths = await listUserBackupObjectPaths(input.supabase, input.config.backupBucket, input.userId);
  const legacyObjectPaths = objectPaths.filter((path) => isLegacyPlaintextCloudObjectPath(path, input.userId));

  if (legacyObjectPaths.length > 0) {
    await removeCloudObjects(input.supabase, input.config.backupBucket, legacyObjectPaths);
  }

  const { error } = await input.supabase
    .from(input.config.backupTable)
    .delete()
    .eq("user_id", input.userId)
    .eq("encrypted", false);

  if (error) {
    throw error;
  }
}

function isLegacyPlaintextCloudObjectPath(path: string, userId: string): boolean {
  if (path.startsWith(`${userId}/snapshots/`)) {
    return path.endsWith(".json");
  }

  if (path.startsWith(`${userId}/assets/`)) {
    return !path.endsWith(".enc");
  }

  return false;
}

async function removeCloudObjects(supabase: SupabaseClient, bucket: string, objectPaths: string[]): Promise<void> {
  for (let index = 0; index < objectPaths.length; index += CLOUD_STORAGE_REMOVE_BATCH_SIZE) {
    const batch = objectPaths.slice(index, index + CLOUD_STORAGE_REMOVE_BATCH_SIZE);
    const { error } = await supabase.storage.from(bucket).remove(batch);

    if (error) {
      throw error;
    }
  }
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

async function readBlobBytes(blob: Blob): Promise<Uint8Array> {
  if (typeof blob.arrayBuffer === "function") {
    return new Uint8Array(await blob.arrayBuffer());
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(reader.error ?? new Error("Could not read cloud backup."));
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(reader.result));
        return;
      }

      reject(new Error("Could not read cloud backup."));
    };
    reader.readAsArrayBuffer(blob);
  });
}

async function sha256Bytes(bytes: Uint8Array): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    return sha256Text(bytesToBase64(bytes));
  }

  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
