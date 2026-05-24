import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockExtensionApi = vi.hoisted(() => ({
  browser: {
    downloads: {
      download: vi.fn(),
    },
  },
}));

vi.mock("../src/browser/extensionApi", () => ({
  default: mockExtensionApi.browser,
}));

import { forceNotebookAutosave, noteNotebookDataChanged } from "../src/background/autosave";
import { contentHashFromParts } from "../src/core/hash";
import {
  appendMessage,
  createNotebook,
  getNotebookAutosaveMetadata,
  getStoredNotebookBackup,
  getStoredNotebookBackups,
} from "../src/core/repository";
import { resetDatabaseForTests } from "../src/storage/db";

describe("notebook autosave", () => {
  beforeEach(async () => {
    await resetDatabaseForTests();
    mockExtensionApi.browser.downloads.download.mockReset();
    mockExtensionApi.browser.downloads.download.mockResolvedValue(1);
    URL.createObjectURL = vi.fn();
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:chatgpt-notebook-backup");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps an extension backup copy and only writes automatic downloads outside Chrome", async () => {
    vi.spyOn(Date, "now").mockReturnValue(Date.UTC(2026, 4, 22, 9, 30, 0));
    const notebook = await createNotebook({ title: "Private storage" });

    await appendMessage(notebook.id, messageInput("Saved inside the add-on"));
    await noteNotebookDataChanged();
    const status = await forceNotebookAutosave();
    const latest = await getStoredNotebookBackup("autosave:latest");
    const daily = await getStoredNotebookBackup("autosave:daily:2026-05-22");

    expect(status).toMatchObject({
      state: "idle",
      dataRevision: 1,
      lastBackupRevision: 1,
      lastBackupAt: "2026-05-22T09:30:00.000Z",
    });
    expect(latest).toMatchObject({
      kind: "latest",
      filename: "chatgpt-notes-autobackup-latest.json",
      dataRevision: 1,
      exportedAt: "2026-05-22T09:30:00.000Z",
    });
    expect(daily).toMatchObject({
      kind: "daily",
      backupDate: "2026-05-22",
      filename: "chatgpt-notes-autobackup-2026-05-22.json",
    });

    if (__BROWSER_TARGET__ === "chrome") {
      expect(mockExtensionApi.browser.downloads.download).not.toHaveBeenCalled();
    } else {
      expect(mockExtensionApi.browser.downloads.download).toHaveBeenCalledTimes(2);
      expect(mockExtensionApi.browser.downloads.download).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          filename: "ChatGPT Notebook Backups/chatgpt-notes-autobackup-latest.json",
          saveAs: false,
          conflictAction: "overwrite",
        }),
      );
      expect(mockExtensionApi.browser.downloads.download).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          filename: "ChatGPT Notebook Backups/chatgpt-notes-autobackup-2026-05-22.json",
          saveAs: false,
          conflictAction: "overwrite",
        }),
      );
      expect(mockExtensionApi.browser.downloads.download.mock.calls[0]?.[0]?.url).toBe("blob:chatgpt-notebook-backup");
    }

    expect(JSON.parse(latest?.contents ?? "{}")).toMatchObject({
      app: "chatgpt-notes-sidebar",
      backupVersion: 1,
      counts: {
        threads: 1,
        messages: 1,
      },
    });
  });

  it("keeps only the latest seven daily stored backups", async () => {
    const dateNow = vi.spyOn(Date, "now");

    for (let day = 20; day <= 28; day += 1) {
      dateNow.mockReturnValue(Date.UTC(2026, 4, day, 9, 30, 0));
      await noteNotebookDataChanged();
      await forceNotebookAutosave();
    }

    const backups = await getStoredNotebookBackups();
    const dailyDates = backups.filter((backup) => backup.kind === "daily").map((backup) => backup.backupDate);

    expect(dailyDates).toEqual([
      "2026-05-28",
      "2026-05-27",
      "2026-05-26",
      "2026-05-25",
      "2026-05-24",
      "2026-05-23",
      "2026-05-22",
    ]);
    expect(backups.filter((backup) => backup.kind === "latest")).toHaveLength(1);
    expect(await getNotebookAutosaveMetadata()).toMatchObject({
      lastBackupRevision: 9,
      lastDailyBackupDate: "2026-05-28",
    });
  });
});

function messageInput(contentMarkdown: string) {
  return {
    sourceMessageId: null,
    sourceMessageKey: `manual:${contentMarkdown}`,
    contentHash: contentHashFromParts({ contentMarkdown, contentText: contentMarkdown }),
    role: "note" as const,
    title: null,
    contentMarkdown,
    contentText: contentMarkdown,
  };
}
