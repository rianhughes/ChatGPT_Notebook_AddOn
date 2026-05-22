import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getMessageForKeyboardSelection,
  getNoteHeaderParts,
  isEditableKeyboardTarget,
  MessageList,
} from "../src/sidebar/components/MessageList";
import type { SavedMessage } from "../src/core/models";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  document.body.innerHTML = "";
  window.getSelection()?.removeAllRanges();
});

describe("MessageList note headers", () => {
  it("copies the first non-empty line as the default note header and keeps the body intact", () => {
    expect(getNoteHeaderParts(["", "Here is the visible header", "", "Body line one", "Body line two"].join("\n"))).toEqual(
      {
        header: "Here is the visible header",
        bodyMarkdown: "Here is the visible header\n\nBody line one\nBody line two",
      },
    );
  });

  it("strips simple markdown markers from the header text", () => {
    expect(getNoteHeaderParts("## Architecture notes\n\nDetails")).toEqual({
      header: "Architecture notes",
      bodyMarkdown: "## Architecture notes\n\nDetails",
    });
  });

  it("uses a custom note header when one is saved", () => {
    expect(getNoteHeaderParts("## Architecture notes\n\nDetails", "Custom summary")).toEqual({
      header: "Custom summary",
      bodyMarkdown: "## Architecture notes\n\nDetails",
    });
  });

  it("finds the selected note for Backspace text deletion", () => {
    document.body.innerHTML = [
      `<article data-note-message-id="a"><p id="alpha">Alpha beta</p></article>`,
      `<article data-note-message-id="b"><p>Gamma</p></article>`,
    ].join("");
    const alphaText = document.querySelector("#alpha")?.firstChild;
    const range = document.createRange();

    expect(alphaText).not.toBeNull();
    range.setStart(alphaText!, 0);
    range.setEnd(alphaText!, 5);

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    expect(getMessageForKeyboardSelection(selection, [message("a", "Alpha beta"), message("b", "Gamma")])?.id).toBe(
      "a",
    );
  });

  it("leaves Backspace alone inside text editing controls", () => {
    const input = document.createElement("input");
    const textarea = document.createElement("textarea");
    const button = document.createElement("button");

    expect(isEditableKeyboardTarget(input)).toBe(true);
    expect(isEditableKeyboardTarget(textarea)).toBe(true);
    expect(isEditableKeyboardTarget(button)).toBe(false);
  });

  it("deletes highlighted note text when Backspace is pressed", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const note = message("a", "Alpha beta");
    const onDeleteSelectedText = vi.fn();

    await act(() => {
      root.render(
        React.createElement(MessageList, {
          messages: [note],
          undoableMessageIds: new Set<string>(),
          canUndoDeletedMessage: false,
          selectedMessageIds: new Set<string>(),
          isSelectingForMerge: false,
          collapsedMessageIds: new Set<string>(),
          canReorderMessages: false,
          onCollapsedMessageIdsChange: vi.fn(),
          onToggleMessageSelection: vi.fn(),
          onMoveMessageAfter: vi.fn(),
          onCopyMessage: vi.fn(),
          onInsertMessage: vi.fn(),
          onInsertMessageSection: vi.fn(),
          onSaveMessageEdit: vi.fn(async () => undefined),
          onDeleteMessage: vi.fn(),
          onDeleteMessageSection: vi.fn(),
          onDeleteSelectedText,
          onUndoMessageEdit: vi.fn(),
          onUndoDeletedMessage: vi.fn(),
        }),
      );
    });

    const paragraphText = getFirstTextNode(host.querySelector(".markdown-paragraph"));
    const range = document.createRange();

    expect(paragraphText).not.toBeNull();
    range.setStart(paragraphText!, 0);
    range.setEnd(paragraphText!, 5);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    await act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace" }));
    });

    expect(onDeleteSelectedText).toHaveBeenCalledWith(note);

    await act(() => {
      root.unmount();
    });
  });

  it("makes the ChatGPT insert button glow while note text is highlighted", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const note = message("a", "Alpha beta");

    await act(() => {
      root.render(
        React.createElement(MessageList, {
          messages: [note],
          undoableMessageIds: new Set<string>(),
          canUndoDeletedMessage: false,
          selectedMessageIds: new Set<string>(),
          isSelectingForMerge: false,
          collapsedMessageIds: new Set<string>(),
          canReorderMessages: false,
          onCollapsedMessageIdsChange: vi.fn(),
          onToggleMessageSelection: vi.fn(),
          onMoveMessageAfter: vi.fn(),
          onCopyMessage: vi.fn(),
          onInsertMessage: vi.fn(),
          onInsertMessageSection: vi.fn(),
          onSaveMessageEdit: vi.fn(async () => undefined),
          onDeleteMessage: vi.fn(),
          onDeleteMessageSection: vi.fn(),
          onDeleteSelectedText: vi.fn(),
          onUndoMessageEdit: vi.fn(),
          onUndoDeletedMessage: vi.fn(),
        }),
      );
    });

    const paragraphText = getFirstTextNode(host.querySelector(".markdown-paragraph"));
    const sendButton = host.querySelector<HTMLButtonElement>(".message-insert-button");
    const range = document.createRange();

    expect(paragraphText).not.toBeNull();
    expect(sendButton).not.toBeNull();
    expect(sendButton?.classList.contains("has-highlighted-selection")).toBe(false);

    range.setStart(paragraphText!, 0);
    range.setEnd(paragraphText!, 5);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    await act(() => {
      document.dispatchEvent(new Event("selectionchange"));
    });

    expect(sendButton?.classList.contains("has-highlighted-selection")).toBe(true);
    expect(sendButton?.getAttribute("aria-label")).toBe("Insert highlighted text into ChatGPT");

    window.getSelection()?.removeAllRanges();

    await act(() => {
      document.dispatchEvent(new Event("selectionchange"));
    });

    expect(sendButton?.classList.contains("has-highlighted-selection")).toBe(false);

    await act(() => {
      root.unmount();
    });
  });

  it("moves a note when its drag handle is dropped on another note", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const first = message("a", "First note");
    const second = message("b", "Second note");
    const onMoveMessageAfter = vi.fn();

    await act(() => {
      root.render(
        React.createElement(MessageList, {
          messages: [first, second],
          undoableMessageIds: new Set<string>(),
          canUndoDeletedMessage: false,
          selectedMessageIds: new Set<string>(),
          isSelectingForMerge: false,
          collapsedMessageIds: new Set<string>(),
          canReorderMessages: true,
          onCollapsedMessageIdsChange: vi.fn(),
          onToggleMessageSelection: vi.fn(),
          onMoveMessageAfter,
          onCopyMessage: vi.fn(),
          onInsertMessage: vi.fn(),
          onInsertMessageSection: vi.fn(),
          onSaveMessageEdit: vi.fn(async () => undefined),
          onDeleteMessage: vi.fn(),
          onDeleteMessageSection: vi.fn(),
          onDeleteSelectedText: vi.fn(),
          onUndoMessageEdit: vi.fn(),
          onUndoDeletedMessage: vi.fn(),
        }),
      );
    });

    const handles = host.querySelectorAll<HTMLElement>(".message-drag-handle");
    const rows = host.querySelectorAll<HTMLElement>(".message-row");
    const dataTransfer = fakeDataTransfer();

    expect(handles).toHaveLength(2);
    expect(handles[0].getAttribute("draggable")).toBe("true");
    expect(rows[0].hasAttribute("draggable")).toBe(false);

    await act(() => {
      handles[0].dispatchEvent(dragEvent("dragstart", dataTransfer));
    });

    await act(() => {
      rows[1].dispatchEvent(dragEvent("drop", dataTransfer));
    });

    expect(onMoveMessageAfter).toHaveBeenCalledWith(first, second.id);

    await act(() => {
      root.unmount();
    });
  });

  it("shows merge selection checkboxes while selecting notes to merge", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const first = message("a", "First note");
    const second = message("b", "Second note");
    const onToggleMessageSelection = vi.fn();

    await act(() => {
      root.render(
        React.createElement(MessageList, {
          messages: [first, second],
          undoableMessageIds: new Set<string>(),
          canUndoDeletedMessage: false,
          selectedMessageIds: new Set<string>([second.id]),
          isSelectingForMerge: true,
          collapsedMessageIds: new Set<string>(),
          canReorderMessages: false,
          onCollapsedMessageIdsChange: vi.fn(),
          onToggleMessageSelection,
          onMoveMessageAfter: vi.fn(),
          onCopyMessage: vi.fn(),
          onInsertMessage: vi.fn(),
          onInsertMessageSection: vi.fn(),
          onSaveMessageEdit: vi.fn(async () => undefined),
          onDeleteMessage: vi.fn(),
          onDeleteMessageSection: vi.fn(),
          onDeleteSelectedText: vi.fn(),
          onUndoMessageEdit: vi.fn(),
          onUndoDeletedMessage: vi.fn(),
        }),
      );
    });

    const checkboxes = host.querySelectorAll<HTMLInputElement>(".message-select");

    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0].checked).toBe(false);
    expect(checkboxes[1].checked).toBe(true);
    expect(host.querySelectorAll(".message-drag-handle")).toHaveLength(0);

    await act(() => {
      checkboxes[0].click();
    });

    expect(onToggleMessageSelection).toHaveBeenCalledWith(first.id);

    await act(() => {
      root.unmount();
    });
  });

  it("routes the undo button beside delete to restoring a deleted note", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const onUndoDeletedMessage = vi.fn();
    const onUndoMessageEdit = vi.fn();

    await act(() => {
      root.render(
        React.createElement(MessageList, {
          messages: [message("a", "Alpha beta")],
          undoableMessageIds: new Set<string>(),
          canUndoDeletedMessage: true,
          selectedMessageIds: new Set<string>(),
          isSelectingForMerge: false,
          collapsedMessageIds: new Set<string>(),
          canReorderMessages: false,
          onCollapsedMessageIdsChange: vi.fn(),
          onToggleMessageSelection: vi.fn(),
          onMoveMessageAfter: vi.fn(),
          onCopyMessage: vi.fn(),
          onInsertMessage: vi.fn(),
          onInsertMessageSection: vi.fn(),
          onSaveMessageEdit: vi.fn(async () => undefined),
          onDeleteMessage: vi.fn(),
          onDeleteMessageSection: vi.fn(),
          onDeleteSelectedText: vi.fn(),
          onUndoMessageEdit,
          onUndoDeletedMessage,
        }),
      );
    });

    const deleteButton = host.querySelector<HTMLButtonElement>('button[aria-label="Delete note"]');
    const undoButton = host.querySelector<HTMLButtonElement>('button[aria-label="Undo deleted note"]');
    const actionButtons = Array.from(deleteButton?.parentElement?.children ?? []);

    expect(undoButton).not.toBeNull();
    expect(actionButtons.indexOf(undoButton!)).toBe(actionButtons.indexOf(deleteButton!) + 1);

    await act(() => {
      undoButton?.click();
    });

    expect(onUndoDeletedMessage).toHaveBeenCalledTimes(1);
    expect(onUndoMessageEdit).not.toHaveBeenCalled();

    await act(() => {
      root.unmount();
    });
  });

  it("keeps deleted-note undo available when the deleted note was the last visible note", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const onUndoDeletedMessage = vi.fn();

    await act(() => {
      root.render(
        React.createElement(MessageList, {
          messages: [],
          undoableMessageIds: new Set<string>(),
          canUndoDeletedMessage: true,
          selectedMessageIds: new Set<string>(),
          isSelectingForMerge: false,
          collapsedMessageIds: new Set<string>(),
          canReorderMessages: false,
          onCollapsedMessageIdsChange: vi.fn(),
          onToggleMessageSelection: vi.fn(),
          onMoveMessageAfter: vi.fn(),
          onCopyMessage: vi.fn(),
          onInsertMessage: vi.fn(),
          onInsertMessageSection: vi.fn(),
          onSaveMessageEdit: vi.fn(async () => undefined),
          onDeleteMessage: vi.fn(),
          onDeleteMessageSection: vi.fn(),
          onDeleteSelectedText: vi.fn(),
          onUndoMessageEdit: vi.fn(),
          onUndoDeletedMessage,
        }),
      );
    });

    await act(() => {
      host.querySelector<HTMLButtonElement>('button[aria-label="Undo deleted note"]')?.click();
    });

    expect(onUndoDeletedMessage).toHaveBeenCalledTimes(1);

    await act(() => {
      root.unmount();
    });
  });
});

function message(id: string, contentText: string): SavedMessage {
  return {
    id,
    threadId: "thread",
    sourceMessageId: id,
    sourceMessageKey: id,
    contentHash: id,
    role: "assistant",
    contentMarkdown: contentText,
    contentText,
    prevId: null,
    nextId: null,
    createdAt: 1,
    updatedAt: 1,
  };
}

function getFirstTextNode(element: Element | null): Text | null {
  if (!element) {
    return null;
  }

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const node = walker.nextNode();
  return node instanceof Text ? node : null;
}

function fakeDataTransfer(): DataTransfer {
  const values = new Map<string, string>();

  return {
    dropEffect: "none",
    effectAllowed: "uninitialized",
    files: [] as unknown as FileList,
    items: [] as unknown as DataTransferItemList,
    types: [],
    clearData: vi.fn((type?: string) => {
      if (type) {
        values.delete(type);
      } else {
        values.clear();
      }
    }),
    getData: vi.fn((type: string) => values.get(type) ?? ""),
    setData: vi.fn((type: string, value: string) => {
      values.set(type, value);
    }),
    setDragImage: vi.fn(),
  };
}

function dragEvent(type: string, dataTransfer: DataTransfer): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });

  Object.defineProperty(event, "dataTransfer", {
    value: dataTransfer,
  });

  Object.defineProperty(event, "clientY", {
    value: 0,
  });

  return event;
}
