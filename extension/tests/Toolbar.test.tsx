import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ChatGptThread } from "../src/core/models";
import { Toolbar } from "../src/sidebar/components/Toolbar";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  document.body.innerHTML = "";
});

describe("Toolbar", () => {
  it("shows a new note button for the selected notebook", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const onCreateNote = vi.fn();
    const onUndoNotebook = vi.fn();

    await act(() => {
      root.render(
        <Toolbar
          selectedThread={thread()}
          searchQuery=""
          canMergeMessages
          mergeMode={false}
          selectedMergeCount={0}
          canUndoNotebook
          toolsOpen
          exportFormats={[]}
          onSearchChange={vi.fn()}
          onToolsOpenChange={vi.fn()}
          onRenameThread={vi.fn(async () => undefined)}
          onRequestExport={vi.fn()}
          onRequestPrintExport={vi.fn()}
          onCreateNote={onCreateNote}
          onUndoNotebook={onUndoNotebook}
          onOpenStandaloneWindow={vi.fn()}
          onStartMergeSelection={vi.fn()}
          onConfirmMergeSelection={vi.fn()}
          onCancelMergeSelection={vi.fn()}
        />,
      );
    });

    const newNoteButton = host.querySelector<HTMLButtonElement>('button[aria-label="Create new note"]');
    const undoButton = host.querySelector<HTMLButtonElement>('button[aria-label="Undo notebook change"]');

    expect(newNoteButton).not.toBeNull();
    expect(newNoteButton?.textContent).toContain("New note");
    expect(undoButton).not.toBeNull();
    expect(undoButton?.disabled).toBe(false);

    await act(() => {
      newNoteButton?.click();
    });

    await act(() => {
      undoButton?.click();
    });

    expect(onCreateNote).toHaveBeenCalledTimes(1);
    expect(onUndoNotebook).toHaveBeenCalledTimes(1);

    await act(() => {
      root.unmount();
    });
  });

  it("starts merge selection and confirms selected notes", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const onStartMergeSelection = vi.fn();
    const onConfirmMergeSelection = vi.fn();
    const onCancelMergeSelection = vi.fn();

    await act(() => {
      root.render(
        <Toolbar
          selectedThread={thread()}
          searchQuery=""
          canMergeMessages
          mergeMode={false}
          selectedMergeCount={0}
          canUndoNotebook={false}
          toolsOpen
          exportFormats={[]}
          onSearchChange={vi.fn()}
          onToolsOpenChange={vi.fn()}
          onRenameThread={vi.fn(async () => undefined)}
          onRequestExport={vi.fn()}
          onRequestPrintExport={vi.fn()}
          onCreateNote={vi.fn()}
          onUndoNotebook={vi.fn()}
          onOpenStandaloneWindow={vi.fn()}
          onStartMergeSelection={onStartMergeSelection}
          onConfirmMergeSelection={onConfirmMergeSelection}
          onCancelMergeSelection={onCancelMergeSelection}
        />,
      );
    });

    await act(() => {
      host.querySelector<HTMLButtonElement>('button[aria-label="Merge notes"]')?.click();
    });

    expect(onStartMergeSelection).toHaveBeenCalledTimes(1);

    await act(() => {
      root.render(
        <Toolbar
          selectedThread={thread()}
          searchQuery=""
          canMergeMessages
          mergeMode
          selectedMergeCount={2}
          canUndoNotebook={false}
          toolsOpen
          exportFormats={[]}
          onSearchChange={vi.fn()}
          onToolsOpenChange={vi.fn()}
          onRenameThread={vi.fn(async () => undefined)}
          onRequestExport={vi.fn()}
          onRequestPrintExport={vi.fn()}
          onCreateNote={vi.fn()}
          onUndoNotebook={vi.fn()}
          onOpenStandaloneWindow={vi.fn()}
          onStartMergeSelection={onStartMergeSelection}
          onConfirmMergeSelection={onConfirmMergeSelection}
          onCancelMergeSelection={onCancelMergeSelection}
        />,
      );
    });

    await act(() => {
      host.querySelector<HTMLButtonElement>('button[aria-label="Merge selected notes"]')?.click();
    });

    await act(() => {
      host.querySelector<HTMLButtonElement>('button[aria-label="Cancel merge"]')?.click();
    });

    expect(onConfirmMergeSelection).toHaveBeenCalledTimes(1);
    expect(onCancelMergeSelection).toHaveBeenCalledTimes(1);

    await act(() => {
      root.unmount();
    });
  });
});

function thread(): ChatGptThread {
  return {
    id: "thread",
    source: "notebook",
    sourceThreadId: "notebook:thread",
    title: "Notebook",
    folderId: null,
    headMessageId: null,
    tailMessageId: null,
    messageCount: 0,
    sortOrder: 0,
    createdAt: 1,
    updatedAt: 1,
  };
}
