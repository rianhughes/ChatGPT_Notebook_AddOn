import browser from "../browser/extensionApi";
import { createNotebookBackupData } from "../core/notebookBackup";
import type { AutosaveStatusResponse, AutosaveStatusState } from "../core/ports";
import {
  getNotebookAutosaveMetadata,
  getNotebookBackupSnapshot,
  markNotebookBackupFailed,
  markNotebookBackupSucceeded,
  recordNotebookDataMutation,
} from "../core/repository";

const AUTOSAVE_DELAY_MS = 10_000;
const BACKUP_DIR = "ChatGPT Notebook Backups";
const BACKUP_RETENTION_DAYS = 7;

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

    await downloadTextFile({
      contents,
      filename: `${BACKUP_DIR}/chatgpt-notes-autobackup-latest.json`,
      overwrite: true,
    });
    await downloadTextFile({
      contents,
      filename: `${BACKUP_DIR}/chatgpt-notes-autobackup-${backupDate}.json`,
      overwrite: true,
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

async function downloadTextFile(input: {
  contents: string;
  filename: string;
  overwrite: boolean;
}): Promise<void> {
  const url = createDownloadUrl(input.contents);

  try {
    await browser.downloads.download({
      url,
      filename: input.filename,
      saveAs: false,
      conflictAction: input.overwrite ? "overwrite" : "uniquify",
    });
  } finally {
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }
}

function createDownloadUrl(contents: string): string {
  if (typeof URL.createObjectURL === "function") {
    return URL.createObjectURL(new Blob([contents], { type: "application/json;charset=utf-8" }));
  }

  return `data:application/json;charset=utf-8,${encodeURIComponent(contents)}`;
}

async function cleanupOldDailyBackups(currentDate: string): Promise<void> {
  const cutoff = new Date(`${currentDate}T00:00:00.000Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - BACKUP_RETENTION_DAYS + 1);

  try {
    const downloads = await browser.downloads.search({ query: ["chatgpt-notes-autobackup-"] });

    await Promise.all(
      downloads.map(async (download) => {
        if (!download.id || !download.filename) {
          return;
        }

        const date = getDailyBackupDateFromFilename(download.filename);

        if (!date || date >= cutoff) {
          return;
        }

        try {
          await browser.downloads.removeFile(download.id);
        } catch {
          // The file may already be gone or the browser may not allow removal.
        }

        try {
          await browser.downloads.erase({ id: download.id });
        } catch {
          // Download history cleanup is best-effort.
        }
      }),
    );
  } catch {
    // Retention cleanup must not make the backup itself fail.
  }
}

function getDailyBackupDateFromFilename(filename: string): Date | null {
  const match = /chatgpt-notes-autobackup-(\d{4}-\d{2}-\d{2})\.json$/.exec(filename);

  if (!match) {
    return null;
  }

  return new Date(`${match[1]}T00:00:00.000Z`);
}
