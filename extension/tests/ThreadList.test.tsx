import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ChatGptThread, NotebookFolder } from "../src/core/models";
import { ThreadList } from "../src/sidebar/components/ThreadList";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement | null = null;
let root: Root | null = null;

afterEach(() => {
  if (root) {
    act(() => {
      root?.unmount();
    });
  }

  host?.remove();
  host = null;
  root = null;
  vi.restoreAllMocks();
});

describe("ThreadList folders", () => {
  it("starts with folder notebook lists collapsed and toggles them", async () => {
    await renderThreadList();

    const workToggle = getToggle("folder-work-notebooks");
    const workContent = getContent("folder-work-notebooks");
    const unfiledToggle = getToggle("unfiled-notebooks-list");
    const unfiledContent = getContent("unfiled-notebooks-list");

    expect(workToggle.getAttribute("aria-expanded")).toBe("false");
    expect(workContent.hidden).toBe(true);
    expect(unfiledToggle.getAttribute("aria-expanded")).toBe("false");
    expect(unfiledContent.hidden).toBe(true);

    await act(() => {
      workToggle.click();
    });

    expect(workToggle.getAttribute("aria-expanded")).toBe("true");
    expect(workContent.hidden).toBe(false);
    expect(unfiledContent.hidden).toBe(true);

    await act(() => {
      workToggle.click();
    });

    expect(workToggle.getAttribute("aria-expanded")).toBe("false");
    expect(workContent.hidden).toBe(true);
  });

  it("renames notebooks and folders from the list without legacy move controls", async () => {
    const onRenameThread = vi.fn();
    const onRenameFolder = vi.fn();

    await renderThreadList({ onRenameThread, onRenameFolder });

    expect(host?.querySelector(".thread-folder-select")).toBeNull();
    expect(host?.querySelector("button[aria-label^='Move']")).toBeNull();

    await act(() => {
      getButton("Edit notebook name: Work notebook").click();
    });

    const threadInput = getInput("thread-thread-work-title");

    await act(() => {
      setControlValue(threadInput, "Renamed notebook");
    });
    await act(() => {
      threadInput.closest("form")?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(onRenameThread).toHaveBeenCalledWith("thread-work", "Renamed notebook");

    await act(() => {
      getButton("Edit folder name: Work").click();
    });

    const folderInput = getInput("folder-work-title-input");

    await act(() => {
      setControlValue(folderInput, "Renamed folder");
    });
    await act(() => {
      folderInput.closest("form")?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(onRenameFolder).toHaveBeenCalledWith("work", "Renamed folder");
  });

  it("calls notebook row reorder when a notebook is dropped within its folder", async () => {
    const onMoveThreadAfter = vi.fn();

    await renderThreadList({
      onMoveThreadAfter,
      threads: [
        thread({ id: "thread-work", title: "Work notebook", folderId: "work" }),
        thread({ id: "thread-second", title: "Second notebook", folderId: "work" }),
        thread({ id: "thread-loose", title: "Loose notebook", folderId: null }),
      ],
    });

    await act(() => {
      getToggle("folder-work-notebooks").click();
    });

    const dragged = getThreadRow("thread-work");
    const target = getThreadRow("thread-second");
    setRowBounds(target, { top: 0, height: 100 });

    await act(() => {
      dragged.dispatchEvent(createDragEvent("dragstart", { dataTransfer: createDataTransfer() }));
    });

    const dataTransfer = createDataTransfer({ "text/plain": "thread-work" });

    await act(() => {
      target.dispatchEvent(createDragEvent("dragover", { clientY: 75, dataTransfer }));
    });
    await act(() => {
      target.dispatchEvent(createDragEvent("drop", { clientY: 75, dataTransfer }));
    });

    expect(onMoveThreadAfter).toHaveBeenCalledWith(
      expect.objectContaining({ id: "thread-work" }),
      "thread-second",
    );
  });

  it("keeps backup import and export in the expandable notebook bar tools", async () => {
    const onExportBackup = vi.fn();

    await renderThreadList({
      onExportBackup,
      autosaveControl: (
        <button type="button" aria-label="Back up now">
          Save
        </button>
      ),
    });

    expect(host?.querySelector('button[aria-label="Export all data"]')).toBeNull();
    expect(host?.querySelector('button[aria-label="Import all data"]')).toBeNull();
    expect(host?.querySelector('button[aria-label="Back up now"]')).toBeNull();

    const tools = getContent("notebook-list-tools");
    expect(tools.hidden).toBe(true);

    await act(() => {
      getButton("Show notebook tools").click();
    });

    expect(tools.hidden).toBe(false);
    expect(host?.querySelector('input[placeholder="New notebook"]')).not.toBeNull();
    expect(host?.querySelector('input[placeholder="New folder"]')).not.toBeNull();

    getButton("Back up now");
    getButton("Import all data");
    const exportButton = getButton("Export all data");

    await act(() => {
      exportButton.click();
    });

    expect(onExportBackup).toHaveBeenCalledOnce();
  });
});

type RenderThreadListOptions = {
  onRenameThread?: (threadId: string, title: string) => void;
  onRenameFolder?: (folderId: string, title: string) => void;
  onMoveThreadAfter?: (thread: ChatGptThread, afterThreadId: string | null) => void;
  onExportBackup?: () => void;
  autosaveControl?: ReactNode;
  threads?: ChatGptThread[];
};

async function renderThreadList({
  onRenameThread = vi.fn(),
  onRenameFolder = vi.fn(),
  onMoveThreadAfter = vi.fn(),
  onExportBackup = vi.fn(),
  autosaveControl,
  threads = [
    thread({ id: "thread-work", title: "Work notebook", folderId: "work" }),
    thread({ id: "thread-loose", title: "Loose notebook", folderId: null }),
  ],
}: RenderThreadListOptions = {}) {
  host = document.createElement("div");
  root = createRoot(host);

  await act(() => {
    root?.render(
      <ThreadList
        threads={threads}
        folders={[folder({ id: "work", title: "Work" })]}
        filter=""
        newNotebookTitle=""
        newFolderTitle=""
        themeToggle={<button type="button">Theme</button>}
        autosaveControl={autosaveControl}
        selectedThreadId={null}
        isFullPage
        onFilterChange={vi.fn()}
        onNewNotebookTitleChange={vi.fn()}
        onNewFolderTitleChange={vi.fn()}
        onCreateNotebook={vi.fn()}
        onCreateFolder={vi.fn()}
        onSelectThread={vi.fn()}
        onRenameThread={onRenameThread}
        onRenameFolder={onRenameFolder}
        onMoveThreadToFolder={vi.fn()}
        onMoveThreadAfter={onMoveThreadAfter}
        onDeleteThread={vi.fn()}
        onDeleteFolder={vi.fn()}
        onExportBackup={onExportBackup}
        onImportBackup={vi.fn()}
      />,
    );
  });
}

function getThreadRow(threadId: string): HTMLElement {
  const row = host?.querySelector<HTMLElement>(`[data-notebook-thread-row-id="${threadId}"]`) ?? null;

  if (!row) {
    throw new Error(`Missing thread row ${threadId}`);
  }

  return row;
}

function setRowBounds(row: HTMLElement, bounds: { top: number; height: number }): void {
  row.getBoundingClientRect = () =>
    ({
      x: 0,
      y: bounds.top,
      top: bounds.top,
      left: 0,
      right: 200,
      bottom: bounds.top + bounds.height,
      width: 200,
      height: bounds.height,
      toJSON: () => ({}),
    }) as DOMRect;
}

function createDataTransfer(initialData: Record<string, string> = {}): DataTransfer {
  const store = new Map(Object.entries(initialData));

  return {
    dropEffect: "none",
    effectAllowed: "all",
    getData: (type: string) => store.get(type) ?? "",
    setData: (type: string, value: string) => {
      store.set(type, value);
    },
  } as DataTransfer;
}

function createDragEvent(
  type: string,
  options: { clientY?: number; dataTransfer: DataTransfer },
): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });

  Object.defineProperties(event, {
    clientY: { value: options.clientY ?? 0 },
    dataTransfer: { value: options.dataTransfer },
  });

  return event;
}

function getToggle(contentId: string): HTMLButtonElement {
  const toggle = host?.querySelector<HTMLButtonElement>(`button[aria-controls="${contentId}"]`) ?? null;

  if (!toggle) {
    throw new Error(`Missing toggle for ${contentId}`);
  }

  return toggle;
}

function getContent(contentId: string): HTMLElement {
  const content = host?.querySelector<HTMLElement>(`#${contentId}`) ?? null;

  if (!content) {
    throw new Error(`Missing folder content ${contentId}`);
  }

  return content;
}

function getButton(label: string): HTMLButtonElement {
  const button = host?.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`) ?? null;

  if (!button) {
    throw new Error(`Missing button ${label}`);
  }

  return button;
}

function getInput(id: string): HTMLInputElement {
  const input = host?.querySelector<HTMLInputElement>(`#${id}`) ?? null;

  if (!input) {
    throw new Error(`Missing input ${id}`);
  }

  return input;
}

function setControlValue(control: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(control), "value")?.set;
  setter?.call(control, value);
  control.dispatchEvent(new Event("input", { bubbles: true }));
}

function folder(overrides: Partial<NotebookFolder>): NotebookFolder {
  return {
    id: "folder",
    title: "Folder",
    sortOrder: 0,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

function thread(overrides: Partial<ChatGptThread>): ChatGptThread {
  return {
    id: "thread",
    source: "notebook",
    sourceThreadId: "notebook:thread",
    title: "Notebook",
    folderId: null,
    messageCount: 0,
    sortOrder: 0,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}
