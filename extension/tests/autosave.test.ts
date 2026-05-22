import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("stores automatic backups in extension storage instead of downloads", async () => {
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
