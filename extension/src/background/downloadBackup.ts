import browser from "../browser/extensionApi";

const BACKUP_DOWNLOAD_DIRECTORY = "ChatGPT Notebook Backups";

export type BackupDownloadFile = {
  filename: string;
  contents: string;
};

export async function writeBackupFilesToDownloads(files: BackupDownloadFile[]): Promise<void> {
  const downloadsApi = browser.downloads;

  if (!downloadsApi?.download) {
    throw new Error("Automatic backup downloads are unavailable.");
  }

  for (const file of files) {
    const downloadUrl = createJsonDownloadUrl(file.contents);

    await downloadsApi.download({
      url: downloadUrl.url,
      filename: `${BACKUP_DOWNLOAD_DIRECTORY}/${file.filename}`,
      saveAs: false,
      conflictAction: "overwrite",
    });

    downloadUrl.revoke();
  }
}

function createJsonDownloadUrl(contents: string): { url: string; revoke(): void } {
  if (typeof URL.createObjectURL === "function") {
    const blob = new Blob([contents], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    return {
      url,
      revoke: () => {
        globalThis.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
    };
  }

  return {
    url: `data:application/json;charset=utf-8,${encodeURIComponent(contents)}`,
    revoke: () => undefined,
  };
}
