import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getMessageForKeyboardSelection,
  getNoteHeaderParts,
  isEditableKeyboardTarget,
  MessageList,
} from "../src/sidebar/components/MessageList";
import { NOTE_SELECTION_DRAG_TYPE, parseNoteSelectionDragPayload } from "../src/sidebar/insertSelection";
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

  it("finds the selected note for keyboard text deletion", () => {
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

  it("leaves keyboard deletion alone inside text editing controls", () => {
    const input = document.createElement("input");
    const textarea = document.createElement("textarea");
    const button = document.createElement("button");

    expect(isEditableKeyboardTarget(input)).toBe(true);
    expect(isEditableKeyboardTarget(textarea)).toBe(true);
    expect(isEditableKeyboardTarget(button)).toBe(false);
  });

  it.each(["Backspace", "Delete"])("deletes highlighted note text when %s is pressed", async (key) => {
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
          onMakeSelectionHeading: vi.fn(),
          onInsertMessage: vi.fn(),
          onInsertMessageSection: vi.fn(),
          onMoveSelectedTextToSection: vi.fn(),
          onSaveSelectedTextEdit: vi.fn(async () => undefined),
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
      window.dispatchEvent(new KeyboardEvent("keydown", { key }));
    });

    expect(onDeleteSelectedText).toHaveBeenCalledWith(note);

    await act(() => {
      root.unmount();
    });
  });

  it.each(["Backspace", "Delete"])("keeps the note view still after deleting highlighted text with %s", async (key) => {
    const scrollHost = document.createElement("div");
    const host = document.createElement("div");
    const root = createRoot(host);
    const note = message("a", "Alpha beta");
    const onDeleteSelectedText = vi.fn(async () => {
      scrollHost.scrollTop = 0;
      await Promise.resolve();
      scrollHost.scrollTop = 0;
    });

    document.body.append(scrollHost);
    scrollHost.append(host);
    scrollHost.scrollTop = 180;

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
          onMakeSelectionHeading: vi.fn(),
          onInsertMessage: vi.fn(),
          onInsertMessageSection: vi.fn(),
          onMoveSelectedTextToSection: vi.fn(),
          onSaveSelectedTextEdit: vi.fn(async () => undefined),
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

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(onDeleteSelectedText).toHaveBeenCalledWith(note);
    expect(scrollHost.scrollTop).toBe(180);

    await act(() => {
      root.unmount();
    });
  });

  it("makes the ChatGPT insert button glow while note text is highlighted", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const note = message("a", "Alpha beta");
    const onMakeSelectionHeading = vi.fn();

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
          onMakeSelectionHeading,
          onInsertMessage: vi.fn(),
          onInsertMessageSection: vi.fn(),
          onMoveSelectedTextToSection: vi.fn(),
          onSaveSelectedTextEdit: vi.fn(async () => undefined),
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
    const headingButton = host.querySelector<HTMLButtonElement>(".message-heading-button");
    const boldButton = host.querySelector<HTMLButtonElement>(".message-bold-button");
    const sendButton = host.querySelector<HTMLButtonElement>(".message-insert-button");
    const range = document.createRange();

    expect(paragraphText).not.toBeNull();
    expect(headingButton).not.toBeNull();
    expect(boldButton).not.toBeNull();
    expect(sendButton).not.toBeNull();
    expect(headingButton?.classList.contains("has-highlighted-selection")).toBe(false);
    expect(boldButton?.classList.contains("has-highlighted-selection")).toBe(false);
    expect(boldButton?.disabled).toBe(true);
    expect(sendButton?.classList.contains("has-highlighted-selection")).toBe(false);

    range.setStart(paragraphText!, 0);
    range.setEnd(paragraphText!, 5);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    await act(() => {
      document.dispatchEvent(new Event("selectionchange"));
    });

    expect(headingButton?.classList.contains("has-highlighted-selection")).toBe(true);
    expect(headingButton?.getAttribute("aria-label")).toBe("Make highlighted text a collapsible header");
    expect(boldButton?.classList.contains("has-highlighted-selection")).toBe(true);
    expect(boldButton?.getAttribute("aria-label")).toBe("Bold highlighted text");
    expect(boldButton?.disabled).toBe(false);
    expect(sendButton?.classList.contains("has-highlighted-selection")).toBe(true);
    expect(sendButton?.getAttribute("aria-label")).toBe("Insert highlighted text into ChatGPT");

    await act(() => {
      headingButton?.click();
    });

    expect(onMakeSelectionHeading).toHaveBeenCalledWith(note);

    window.getSelection()?.removeAllRanges();

    await act(() => {
      document.dispatchEvent(new Event("selectionchange"));
    });

    expect(headingButton?.classList.contains("has-highlighted-selection")).toBe(false);
    expect(boldButton?.classList.contains("has-highlighted-selection")).toBe(false);
    expect(boldButton?.disabled).toBe(true);
    expect(sendButton?.classList.contains("has-highlighted-selection")).toBe(false);

    await act(() => {
      root.unmount();
    });
  });

  it("wraps highlighted note text in bold markdown from the section action row", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const note = message("a", "Alpha beta");
    const onSaveSelectedTextEdit = vi.fn(async () => undefined);

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
          onMakeSelectionHeading: vi.fn(),
          onInsertMessage: vi.fn(),
          onInsertMessageSection: vi.fn(),
          onMoveSelectedTextToSection: vi.fn(),
          onSaveSelectedTextEdit,
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
    const boldButton = host.querySelector<HTMLButtonElement>(".message-bold-button");
    const range = document.createRange();

    expect(paragraphText).not.toBeNull();
    expect(boldButton).not.toBeNull();

    range.setStart(paragraphText!, 0);
    range.setEnd(paragraphText!, 5);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    await act(() => {
      document.dispatchEvent(new Event("selectionchange"));
    });

    await act(async () => {
      boldButton?.click();
      await Promise.resolve();
    });

    expect(onSaveSelectedTextEdit).toHaveBeenCalledWith(note, "Alpha", "**Alpha**");

    await act(() => {
      root.unmount();
    });
  });

  it("makes the edit button edit only highlighted note text", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const note = message("a", "Alpha beta");
    const onSaveSelectedTextEdit = vi.fn(async () => undefined);

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
          onMakeSelectionHeading: vi.fn(),
          onInsertMessage: vi.fn(),
          onInsertMessageSection: vi.fn(),
          onMoveSelectedTextToSection: vi.fn(),
          onSaveSelectedTextEdit,
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
    const editButton = host.querySelector<HTMLButtonElement>(".message-edit-button");
    const range = document.createRange();

    expect(paragraphText).not.toBeNull();
    expect(editButton).not.toBeNull();
    expect(editButton?.classList.contains("has-highlighted-selection")).toBe(false);

    range.setStart(paragraphText!, 0);
    range.setEnd(paragraphText!, 5);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    await act(() => {
      document.dispatchEvent(new Event("selectionchange"));
    });

    expect(editButton?.classList.contains("has-highlighted-selection")).toBe(true);
    expect(editButton?.getAttribute("aria-label")).toBe("Edit highlighted text");

    await act(() => {
      editButton?.click();
    });

    const editor = host.querySelector<HTMLTextAreaElement>("textarea[aria-label='Edit highlighted text']");

    expect(editor).not.toBeNull();
    expect(editor?.value).toBe("Alpha");

    await act(() => {
      setControlValue(editor!, "Edited alpha");
    });

    await act(async () => {
      host.querySelector<HTMLButtonElement>(".message-selection-editor .tool-button")?.click();
      await Promise.resolve();
    });

    expect(onSaveSelectedTextEdit).toHaveBeenCalledWith(note, "Alpha", "Edited alpha");

    await act(() => {
      root.unmount();
    });
  });

  it("formats pasted table text in the full note editor before saving", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const note = message("a", "Draft note");
    const onSaveMessageEdit = vi.fn(async () => undefined);

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
          onMakeSelectionHeading: vi.fn(),
          onInsertMessage: vi.fn(),
          onInsertMessageSection: vi.fn(),
          onMoveSelectedTextToSection: vi.fn(),
          onSaveSelectedTextEdit: vi.fn(async () => undefined),
          onSaveMessageEdit,
          onDeleteMessage: vi.fn(),
          onDeleteMessageSection: vi.fn(),
          onDeleteSelectedText: vi.fn(),
          onUndoMessageEdit: vi.fn(),
          onUndoDeletedMessage: vi.fn(),
        }),
      );
    });

    await act(() => {
      host.querySelector<HTMLButtonElement>(".message-edit-button")?.click();
    });

    const textarea = host.querySelector<HTMLTextAreaElement>("textarea[aria-label='Edit note Markdown']");
    const pasted = [
      "Assuming RP means RPC.",
      "Step\tCode location\tInput\tOutput\tBottleneck",
      "1. RPC server setup\tnode/node.go\tConfigured RPC paths\tHTTP mux routes path\tStartup only",
    ].join("\n");

    expect(textarea).not.toBeNull();

    await act(() => {
      setControlValue(textarea!, pasted);
    });

    await act(() => {
      host.querySelector<HTMLButtonElement>('button[aria-label="Format pasted text"]')?.click();
    });

    expect(textarea?.value).toContain("| Step | Code location | Input | Output | Bottleneck |");
    expect(textarea?.value).toContain("| 1. RPC server setup | node/node.go | Configured RPC paths | HTTP mux routes path | Startup only |");

    await act(async () => {
      host.querySelector<HTMLButtonElement>(".message-editor-actions .tool-button:not(.secondary)")?.click();
      await Promise.resolve();
    });

    expect(onSaveMessageEdit).toHaveBeenCalledWith(note, "Draft note", textarea?.value);

    await act(() => {
      root.unmount();
    });
  });

  it("opens the requested note in edit mode and focuses the title field", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const note = { ...message("new-note", ""), role: "note" as const, title: "New note" };
    const onAutoEditMessageHandled = vi.fn();

    function Harness() {
      const [collapsedMessageIds, setCollapsedMessageIds] = React.useState<Set<string>>(() => new Set([note.id]));
      const [autoEditMessageId, setAutoEditMessageId] = React.useState<string | null>(note.id);

      return React.createElement(MessageList, {
        messages: [note],
        undoableMessageIds: new Set<string>(),
        canUndoDeletedMessage: false,
        selectedMessageIds: new Set<string>(),
        autoEditMessageId,
        isSelectingForMerge: false,
        collapsedMessageIds,
        canReorderMessages: false,
        onAutoEditMessageHandled: () => {
          setAutoEditMessageId(null);
          onAutoEditMessageHandled();
        },
        onCollapsedMessageIdsChange: setCollapsedMessageIds,
        onToggleMessageSelection: vi.fn(),
        onMoveMessageAfter: vi.fn(),
        onMakeSelectionHeading: vi.fn(),
        onInsertMessage: vi.fn(),
        onInsertMessageSection: vi.fn(),
        onMoveSelectedTextToSection: vi.fn(),
        onSaveSelectedTextEdit: vi.fn(async () => undefined),
        onSaveMessageEdit: vi.fn(async () => undefined),
        onDeleteMessage: vi.fn(),
        onDeleteMessageSection: vi.fn(),
        onDeleteSelectedText: vi.fn(),
        onUndoMessageEdit: vi.fn(),
        onUndoDeletedMessage: vi.fn(),
      });
    }

    await act(() => {
      root.render(React.createElement(Harness));
    });

    const titleInput = host.querySelector<HTMLInputElement>(".message-editor-title-input");

    expect(titleInput).not.toBeNull();
    expect(titleInput?.value).toBe("New note");
    expect(document.activeElement).toBe(titleInput);
    expect(onAutoEditMessageHandled).toHaveBeenCalledTimes(1);

    await act(() => {
      root.unmount();
    });
  });

  it("saves a newly opened note when its title field submits", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const note = { ...message("new-note", ""), role: "note" as const, title: "New note" };
    const onSaveMessageEdit = vi.fn(async () => undefined);

    await act(() => {
      root.render(
        React.createElement(MessageList, {
          messages: [note],
          undoableMessageIds: new Set<string>(),
          canUndoDeletedMessage: false,
          selectedMessageIds: new Set<string>(),
          autoEditMessageId: note.id,
          isSelectingForMerge: false,
          collapsedMessageIds: new Set<string>(),
          canReorderMessages: false,
          onAutoEditMessageHandled: vi.fn(),
          onCollapsedMessageIdsChange: vi.fn(),
          onToggleMessageSelection: vi.fn(),
          onMoveMessageAfter: vi.fn(),
          onMakeSelectionHeading: vi.fn(),
          onInsertMessage: vi.fn(),
          onInsertMessageSection: vi.fn(),
          onMoveSelectedTextToSection: vi.fn(),
          onSaveSelectedTextEdit: vi.fn(async () => undefined),
          onSaveMessageEdit,
          onDeleteMessage: vi.fn(),
          onDeleteMessageSection: vi.fn(),
          onDeleteSelectedText: vi.fn(),
          onUndoMessageEdit: vi.fn(),
          onUndoDeletedMessage: vi.fn(),
        }),
      );
    });

    const titleInput = host.querySelector<HTMLInputElement>(".message-editor-title-input");
    const editorForm = host.querySelector<HTMLFormElement>(".message-editor");

    expect(titleInput).not.toBeNull();
    expect(editorForm).not.toBeNull();

    await act(() => {
      setControlValue(titleInput!, "Saved from Enter");
    });

    await act(async () => {
      editorForm?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await Promise.resolve();
    });

    expect(onSaveMessageEdit).toHaveBeenCalledWith(note, "Saved from Enter", "");

    await act(() => {
      root.unmount();
    });
  });

  it("cancels a newly opened note edit when Escape is pressed", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const note = { ...message("new-note", ""), role: "note" as const, title: "New note" };
    const onSaveMessageEdit = vi.fn(async () => undefined);

    await act(() => {
      root.render(
        React.createElement(MessageList, {
          messages: [note],
          undoableMessageIds: new Set<string>(),
          canUndoDeletedMessage: false,
          selectedMessageIds: new Set<string>(),
          autoEditMessageId: note.id,
          isSelectingForMerge: false,
          collapsedMessageIds: new Set<string>(),
          canReorderMessages: false,
          onAutoEditMessageHandled: vi.fn(),
          onCollapsedMessageIdsChange: vi.fn(),
          onToggleMessageSelection: vi.fn(),
          onMoveMessageAfter: vi.fn(),
          onMakeSelectionHeading: vi.fn(),
          onInsertMessage: vi.fn(),
          onInsertMessageSection: vi.fn(),
          onMoveSelectedTextToSection: vi.fn(),
          onSaveSelectedTextEdit: vi.fn(async () => undefined),
          onSaveMessageEdit,
          onDeleteMessage: vi.fn(),
          onDeleteMessageSection: vi.fn(),
          onDeleteSelectedText: vi.fn(),
          onUndoMessageEdit: vi.fn(),
          onUndoDeletedMessage: vi.fn(),
        }),
      );
    });

    const titleInput = host.querySelector<HTMLInputElement>(".message-editor-title-input");

    expect(titleInput).not.toBeNull();

    await act(() => {
      setControlValue(titleInput!, "Unsaved title");
      titleInput?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    });

    expect(host.querySelector(".message-editor")).toBeNull();
    expect(host.querySelector(".message-header-text")?.textContent).toBe("New note");
    expect(onSaveMessageEdit).not.toHaveBeenCalled();

    await act(() => {
      root.unmount();
    });
  });

  it("activates the H2 button for a clicked heading and routes it to unmake that section", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const note = message("a", ["## Alpha", "", "Alpha body"].join("\n"));
    const onMakeSelectionHeading = vi.fn();
    const onUnmakeHeadingSection = vi.fn();

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
          onMakeSelectionHeading,
          onInsertMessage: vi.fn(),
          onInsertMessageSection: vi.fn(),
          onUnmakeHeadingSection,
          onMoveSelectedTextToSection: vi.fn(),
          onSaveSelectedTextEdit: vi.fn(async () => undefined),
          onSaveMessageEdit: vi.fn(async () => undefined),
          onDeleteMessage: vi.fn(),
          onDeleteMessageSection: vi.fn(),
          onDeleteSelectedText: vi.fn(),
          onUndoMessageEdit: vi.fn(),
          onUndoDeletedMessage: vi.fn(),
        }),
      );
    });

    const sectionButton = host.querySelector<HTMLButtonElement>(".markdown-heading-button");
    const headingAction = host.querySelector<HTMLButtonElement>(".message-heading-button");

    expect(sectionButton).not.toBeNull();
    expect(headingAction).not.toBeNull();
    expect(headingAction?.classList.contains("is-active")).toBe(false);

    await act(() => {
      sectionButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(headingAction?.classList.contains("is-active")).toBe(true);
    expect(headingAction?.getAttribute("aria-label")).toBe("Unmake selected collapsible header");

    await act(() => {
      headingAction?.click();
    });

    expect(onUnmakeHeadingSection).toHaveBeenCalledWith(note, 0);
    expect(onMakeSelectionHeading).not.toHaveBeenCalled();

    await act(() => {
      root.unmount();
    });
  });

  it("drags highlighted note text onto a heading section", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const note = message("a", ["## Target", "", "Existing body.", "", "Move me"].join("\n"));
    const onMoveSelectedTextToSection = vi.fn();

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
          onMakeSelectionHeading: vi.fn(),
          onInsertMessage: vi.fn(),
          onInsertMessageSection: vi.fn(),
          onMoveSelectedTextToSection,
          onSaveSelectedTextEdit: vi.fn(async () => undefined),
          onSaveMessageEdit: vi.fn(async () => undefined),
          onDeleteMessage: vi.fn(),
          onDeleteMessageSection: vi.fn(),
          onDeleteSelectedText: vi.fn(),
          onUndoMessageEdit: vi.fn(),
          onUndoDeletedMessage: vi.fn(),
        }),
      );
    });

    const article = host.querySelector<HTMLElement>("[data-note-message-id='a']");
    const heading = host.querySelector<HTMLElement>(".markdown-heading");
    const paragraphs = host.querySelectorAll<HTMLElement>(".markdown-paragraph");
    const selectedText = getFirstTextNode(paragraphs[1]);
    const range = document.createRange();
    const dataTransfer = fakeDataTransfer();

    expect(article).not.toBeNull();
    expect(heading).not.toBeNull();
    expect(selectedText).not.toBeNull();
    range.setStart(selectedText!, 0);
    range.setEnd(selectedText!, "Move me".length);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    await act(() => {
      article?.dispatchEvent(dragEvent("dragstart", dataTransfer));
    });

    expect(parseNoteSelectionDragPayload(dataTransfer.getData(NOTE_SELECTION_DRAG_TYPE))).toEqual({
      messageId: note.id,
      text: "Move me",
    });

    await act(() => {
      heading?.dispatchEvent(dragEvent("dragover", dataTransfer));
    });

    expect(heading?.classList.contains("is-drop-target")).toBe(true);

    await act(() => {
      heading?.dispatchEvent(dragEvent("drop", dataTransfer));
    });

    expect(onMoveSelectedTextToSection).toHaveBeenCalledWith(note, 0, {
      messageId: note.id,
      text: "Move me",
    });

    await act(() => {
      root.unmount();
    });
  });

  it("moves a note when its header is dragged onto another note", async () => {
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
          onMakeSelectionHeading: vi.fn(),
          onInsertMessage: vi.fn(),
          onInsertMessageSection: vi.fn(),
          onMoveSelectedTextToSection: vi.fn(),
          onSaveSelectedTextEdit: vi.fn(async () => undefined),
          onSaveMessageEdit: vi.fn(async () => undefined),
          onDeleteMessage: vi.fn(),
          onDeleteMessageSection: vi.fn(),
          onDeleteSelectedText: vi.fn(),
          onUndoMessageEdit: vi.fn(),
          onUndoDeletedMessage: vi.fn(),
        }),
      );
    });

    const headers = host.querySelectorAll<HTMLElement>(".message-collapse-strip");
    const rows = host.querySelectorAll<HTMLElement>(".message-row");
    const dataTransfer = fakeDataTransfer();

    expect(headers).toHaveLength(2);
    expect(headers[0].getAttribute("draggable")).toBe("true");
    expect(host.querySelectorAll(".message-drag-handle")).toHaveLength(0);
    expect(rows[0].hasAttribute("draggable")).toBe(false);

    await act(() => {
      headers[0].dispatchEvent(dragEvent("dragstart", dataTransfer));
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
          onMakeSelectionHeading: vi.fn(),
          onInsertMessage: vi.fn(),
          onInsertMessageSection: vi.fn(),
          onMoveSelectedTextToSection: vi.fn(),
          onSaveSelectedTextEdit: vi.fn(async () => undefined),
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

  it("puts note selection on the left and moves section tools to the lower action row", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const note = message("a", "Alpha beta");
    const onToggleExportTargetMessage = vi.fn();

    await act(() => {
      root.render(
        React.createElement(MessageList, {
          messages: [note],
          undoableMessageIds: new Set<string>(),
          canUndoDeletedMessage: false,
          selectedMessageIds: new Set<string>(),
          exportTargetMessageId: null,
          isSelectingForMerge: false,
          collapsedMessageIds: new Set<string>(),
          canReorderMessages: false,
          onCollapsedMessageIdsChange: vi.fn(),
          onToggleMessageSelection: vi.fn(),
          onToggleExportTargetMessage,
          onMoveMessageAfter: vi.fn(),
          onMakeSelectionHeading: vi.fn(),
          onInsertMessage: vi.fn(),
          onInsertMessageSection: vi.fn(),
          onMoveSelectedTextToSection: vi.fn(),
          onSaveSelectedTextEdit: vi.fn(async () => undefined),
          onSaveMessageEdit: vi.fn(async () => undefined),
          onDeleteMessage: vi.fn(),
          onDeleteMessageSection: vi.fn(),
          onDeleteSelectedText: vi.fn(),
          onUndoMessageEdit: vi.fn(),
          onUndoDeletedMessage: vi.fn(),
        }),
      );
    });

    const rows = host.querySelectorAll<HTMLElement>(".message-actions-row");
    const topButtons = Array.from(rows[0]?.querySelectorAll<HTMLButtonElement>("button") ?? []);
    const lowerButtons = Array.from(rows[1]?.querySelectorAll<HTMLButtonElement>("button") ?? []);
    const selectButton = host.querySelector<HTMLButtonElement>(".message-selection-tools .message-select-note-button");

    expect(rows).toHaveLength(2);
    expect(selectButton?.getAttribute("aria-label")).toBe("Select note");
    expect(topButtons.map((button) => button.getAttribute("aria-label"))).toEqual([
      "Edit message",
      "Delete note",
      "Undo last note edit",
      "Insert into ChatGPT",
    ]);
    expect(lowerButtons.map((button) => button.getAttribute("aria-label"))).toEqual([
      "Collapse all sections",
      "Highlight text to bold",
      "Highlight text to make a collapsible header",
    ]);

    await act(() => {
      selectButton?.click();
    });

    expect(onToggleExportTargetMessage).toHaveBeenCalledWith(note);

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
          onMakeSelectionHeading: vi.fn(),
          onInsertMessage: vi.fn(),
          onInsertMessageSection: vi.fn(),
          onMoveSelectedTextToSection: vi.fn(),
          onSaveSelectedTextEdit: vi.fn(async () => undefined),
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
          onMakeSelectionHeading: vi.fn(),
          onInsertMessage: vi.fn(),
          onInsertMessageSection: vi.fn(),
          onMoveSelectedTextToSection: vi.fn(),
          onSaveSelectedTextEdit: vi.fn(async () => undefined),
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
    sortOrder: 0,
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

function setControlValue(control: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(control), "value");
  descriptor?.set?.call(control, value);
  control.dispatchEvent(new Event("input", { bubbles: true }));
}

function fakeDataTransfer(): DataTransfer {
  const values = new Map<string, string>();
  const types: string[] = [];

  return {
    dropEffect: "none",
    effectAllowed: "uninitialized",
    files: [] as unknown as FileList,
    items: [] as unknown as DataTransferItemList,
    types,
    clearData: vi.fn((type?: string) => {
      if (type) {
        values.delete(type);
        const typeIndex = types.indexOf(type);

        if (typeIndex >= 0) {
          types.splice(typeIndex, 1);
        }
      } else {
        values.clear();
        types.length = 0;
      }
    }),
    getData: vi.fn((type: string) => values.get(type) ?? ""),
    setData: vi.fn((type: string, value: string) => {
      values.set(type, value);

      if (!types.includes(type)) {
        types.push(type);
      }
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
