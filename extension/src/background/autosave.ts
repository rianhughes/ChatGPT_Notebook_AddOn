import { createNotebookBackupData } from "../core/notebookBackup";
import type { AutosaveStatusResponse, AutosaveStatusState } from "../core/ports";
import {
  deleteStoredDailyBackupsBefore,
  getNotebookAutosaveMetadata,
  getNotebookBackupSnapshot,
  markNotebookBackupFailed,
  markNotebookBackupSucceeded,
  recordNotebookDataMutation,
  saveStoredNotebookBackup,
} from "../core/repository";

const AUTOSAVE_DELAY_MS = 10_000;
const BACKUP_RETENTION_DAYS = 7;
const LATEST_BACKUP_ID = "autosave:latest";

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
let writeInProgress = false;
let dirtyWhileWriting = false;
let transientState: AutosaveStatusState | null = null;

export async function noteNotebookDataChanged(): Promise<void> {
  await recordNotebookDataMutation();
  transientState = "pending";
  scheduleAutosave();
}

export async function forceNotebookAutosave(): Promise<AutosaveStatusResponse> {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }

  await flushAutosave();
  return getAutosaveStatus();
}

export async function getAutosaveStatus(): Promise<AutosaveStatusResponse> {
  const metadata = await getNotebookAutosaveMetadata();
  const state = getAutosaveState(metadata);

  return {
    state,
    dataRevision: metadata.dataRevision,
    lastBackupRevision: metadata.lastBackupRevision,
    lastBackupAt: metadata.lastBackupAt,
    lastBackupError: metadata.lastBackupError,
  };
}

function scheduleAutosave(delayMs = AUTOSAVE_DELAY_MS): void {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
  }

  autosaveTimer = setTimeout(() => {
    autosaveTimer = null;
    void flushAutosave();
  }, delayMs);
}

async function flushAutosave(): Promise<void> {
  if (writeInProgress) {
    dirtyWhileWriting = true;
    return;
  }

  writeInProgress = true;
  transientState = "saving";

  try {
    const metadata = await getNotebookAutosaveMetadata();

    if (metadata.dataRevision <= metadata.lastBackupRevision) {
      transientState = null;
      return;
    }

    const snapshot = await getNotebookBackupSnapshot();
    const backupData = await createNotebookBackupData(snapshot, { dataRevision: metadata.dataRevision });
    const contents = `${JSON.stringify(backupData, null, 2)}\n`;
    const backupDate = backupData.exportedAt.slice(0, 10);

    await saveStoredNotebookBackup({
      id: LATEST_BACKUP_ID,
      kind: "latest",
      backupDate: null,
      contents,
      filename: "chatgpt-notes-autobackup-latest.json",
      dataRevision: backupData.dataRevision,
      exportedAt: backupData.exportedAt,
    });
    await saveStoredNotebookBackup({
      id: `autosave:daily:${backupDate}`,
      kind: "daily",
      backupDate,
      contents,
      filename: `chatgpt-notes-autobackup-${backupDate}.json`,
      dataRevision: backupData.dataRevision,
      exportedAt: backupData.exportedAt,
    });
    await cleanupOldDailyBackups(backupDate);
    await markNotebookBackupSucceeded({
      revision: metadata.dataRevision,
      backedUpAt: backupData.exportedAt,
      dailyBackupDate: backupDate,
    });
    transientState = null;
  } catch (error) {
    transientState = "error";
    await markNotebookBackupFailed(error instanceof Error ? error.message : "Autosave backup failed.");
  } finally {
    writeInProgress = false;

    const metadata = await getNotebookAutosaveMetadata();

    if (dirtyWhileWriting || metadata.dataRevision > metadata.lastBackupRevision) {
      dirtyWhileWriting = false;
      transientState = "pending";
      scheduleAutosave();
    }
  }
}

function getAutosaveState(metadata: Awaited<ReturnType<typeof getNotebookAutosaveMetadata>>): AutosaveStatusState {
  if (transientState === "saving") {
    return "saving";
  }

  if (metadata.lastBackupError && metadata.dataRevision > metadata.lastBackupRevision) {
    return "error";
  }

  if (transientState === "pending" || metadata.dataRevision > metadata.lastBackupRevision) {
    return "pending";
  }

  return "idle";
}

async function cleanupOldDailyBackups(currentDate: string): Promise<void> {
  const cutoff = new Date(`${currentDate}T00:00:00.000Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - BACKUP_RETENTION_DAYS + 1);

  try {
    await deleteStoredDailyBackupsBefore(cutoff.toISOString().slice(0, 10));
  } catch {
    // Retention cleanup must not make the backup itself fail.
  }
}
