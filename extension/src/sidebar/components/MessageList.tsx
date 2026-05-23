import { ImagePlus, Sparkles, Square, SquareCheckBig, Undo2 } from "lucide-react";
import type { ClipboardEvent, DragEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { formatPastedNoteMarkdown, markdownToPlainText } from "../../core/markdown";
import type { SavedMessage, ThreadSource } from "../../core/models";
import {
  encodeNoteSelectionDragPayload,
  NOTE_SELECTION_DRAG_TYPE,
  selectionBelongsToElement,
  type NoteSelectionDragPayload,
} from "../insertSelection";
import { MarkdownContent } from "./MarkdownContent";
import { MessageActions } from "./MessageActions";

type MessageListProps = {
  messages: SavedMessage[];
  threadSource?: ThreadSource;
  undoableMessageIds: Set<string>;
  canUndoDeletedMessage: boolean;
  selectedMessageIds: Set<string>;
  exportTargetMessageId?: string | null;
  autoEditMessageId?: string | null;
  isSelectingForMerge: boolean;
  collapsedMessageIds: Set<string>;
  canReorderMessages: boolean;
  onAutoEditMessageHandled?(): void;
  onCollapsedMessageIdsChange(updater: (current: Set<string>) => Set<string>): void;
  onToggleMessageSelection(messageId: string): void;
  onToggleExportTargetMessage?(message: SavedMessage): void;
  onMoveMessageAfter(message: SavedMessage, afterMessageId: string | null): void;
  onMakeSelectionHeading(message: SavedMessage): void;
  onInsertMessage(message: SavedMessage): void;
  onInsertMessageSection(message: SavedMessage, headingIndex: number): void;
  onUnmakeHeadingSection?(message: SavedMessage, headingIndex: number): void;
  onMoveSelectedTextToSection(
    message: SavedMessage,
    headingIndex: number,
    selection: NoteSelectionDragPayload,
  ): void;
  onSaveSelectedTextEdit(message: SavedMessage, selectedText: string, replacementText: string): Promise<void>;
  onSaveMessageEdit(message: SavedMessage, title: string, contentMarkdown: string): Promise<void>;
  onInsertImage?(message: SavedMessage, file: File): Promise<string | null>;
  loadImageAssetUrl?(assetId: string): Promise<string | null>;
  onDeleteMessage(message: SavedMessage): void;
  onDeleteMessageSection(message: SavedMessage, headingIndex: number): void;
  onDeleteSelectedText(message: SavedMessage): void | Promise<void>;
  onUndoMessageEdit(message: SavedMessage): void;
  onUndoDeletedMessage(): void;
};

export function MessageList({
  messages,
  threadSource = "notebook",
  undoableMessageIds,
  canUndoDeletedMessage,
  selectedMessageIds,
  exportTargetMessageId = null,
  autoEditMessageId = null,
  isSelectingForMerge,
  collapsedMessageIds,
  canReorderMessages,
  onAutoEditMessageHandled,
  onCollapsedMessageIdsChange,
  onToggleMessageSelection,
  onToggleExportTargetMessage = () => undefined,
  onMoveMessageAfter,
  onMakeSelectionHeading,
  onInsertMessage,
  onInsertMessageSection,
  onUnmakeHeadingSection,
  onMoveSelectedTextToSection,
  onSaveSelectedTextEdit,
  onSaveMessageEdit,
  onInsertImage = async () => null,
  loadImageAssetUrl,
  onDeleteMessage,
  onDeleteMessageSection,
  onDeleteSelectedText,
  onUndoMessageEdit,
  onUndoDeletedMessage,
}: MessageListProps) {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftMarkdown, setDraftMarkdown] = useState("");
  const [selectedTextEdit, setSelectedTextEdit] = useState<{
    messageId: string;
    selectedText: string;
    draftText: string;
  } | null>(null);
  const [headingCollapsedMessageIds, setHeadingCollapsedMessageIds] = useState<Set<string>>(() => new Set());
  const [draggingMessageId, setDraggingMessageId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ messageId: string; position: "before" | "after" } | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [activeHeadingSection, setActiveHeadingSection] = useState<{
    messageId: string;
    headingIndex: number;
  } | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const handledAutoEditMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (editingMessageId && collapsedMessageIds.has(editingMessageId)) {
      cancelEdit();
    }

    if (selectedTextEdit && collapsedMessageIds.has(selectedTextEdit.messageId)) {
      cancelSelectedTextEdit();
    }

    if (activeHeadingSection && collapsedMessageIds.has(activeHeadingSection.messageId)) {
      setActiveHeadingSection(null);
    }
  }, [activeHeadingSection, collapsedMessageIds, editingMessageId, selectedTextEdit]);

  useEffect(() => {
    if (!autoEditMessageId) {
      handledAutoEditMessageIdRef.current = null;
      return;
    }

    if (handledAutoEditMessageIdRef.current === autoEditMessageId) {
      return;
    }

    const message = messages.find((item) => item.id === autoEditMessageId);

    if (!message) {
      return;
    }

    handledAutoEditMessageIdRef.current = autoEditMessageId;
    startEditing(message);
    onAutoEditMessageHandled?.();
  }, [autoEditMessageId, messages, onAutoEditMessageHandled]);

  useEffect(() => {
    if (!editingMessageId) {
      return;
    }

    const titleInput = titleInputRef.current;

    if (!titleInput) {
      return;
    }

    const messageRow = getMessageRowElement(editingMessageId);

    if (typeof messageRow?.scrollIntoView === "function") {
      messageRow.scrollIntoView({ block: "nearest" });
    }

    titleInput.focus();
    titleInput.select();
  }, [editingMessageId]);

  useEffect(() => {
    function deleteSelectedTextWithKeyboard(event: globalThis.KeyboardEvent) {
      if (
        (event.key !== "Backspace" && event.key !== "Delete") ||
        event.defaultPrevented ||
        isEditableKeyboardTarget(event.target)
      ) {
        return;
      }

      const message = getMessageForKeyboardSelection(window.getSelection(), messages);

      if (!message) {
        return;
      }

      const scrollSnapshot = captureScrollSnapshot(getMessageElement(message.id));

      event.preventDefault();
      void Promise.resolve(onDeleteSelectedText(message)).finally(() => {
        restoreScrollSnapshotAfterRender(scrollSnapshot);
      });
    }

    window.addEventListener("keydown", deleteSelectedTextWithKeyboard);
    return () => window.removeEventListener("keydown", deleteSelectedTextWithKeyboard);
  }, [messages, onDeleteSelectedText]);

  useEffect(() => {
    function updateHighlightedMessage() {
      const messageId = getMessageForKeyboardSelection(window.getSelection(), messages)?.id ?? null;
      setHighlightedMessageId((currentMessageId) => (currentMessageId === messageId ? currentMessageId : messageId));

      if (messageId) {
        setActiveHeadingSection(null);
      }
    }

    updateHighlightedMessage();
    document.addEventListener("selectionchange", updateHighlightedMessage);
    return () => document.removeEventListener("selectionchange", updateHighlightedMessage);
  }, [messages]);

  useEffect(() => {
    setActiveHeadingSection((current) => {
      if (!current || messages.some((message) => message.id === current.messageId)) {
        return current;
      }

      return null;
    });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="empty-state">
        <span>No saved messages in this view.</span>
        {canUndoDeletedMessage ? (
          <button
            className="icon-button empty-state-undo-button"
            type="button"
            title="Undo deleted note"
            aria-label="Undo deleted note"
            onClick={onUndoDeletedMessage}
          >
            <Undo2 size={16} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    );
  }

  function startEditing(message: SavedMessage) {
    clearActiveHeadingSection(message.id);
    setSelectedTextEdit(null);
    setEditingMessageId(message.id);
    setDraftTitle(getNoteHeaderParts(message.contentMarkdown || message.contentText, message.title).header);
    setDraftMarkdown(message.contentMarkdown || message.contentText);
    onCollapsedMessageIdsChange((current) => {
      if (!current.has(message.id)) {
        return current;
      }

      const next = new Set(current);
      next.delete(message.id);
      return next;
    });
  }

  function toggleEditing(message: SavedMessage) {
    if (editingMessageId === message.id) {
      cancelEdit();
      return;
    }

    startEditing(message);
  }

  function handleEditMessage(message: SavedMessage) {
    if (highlightedMessageId === message.id && startSelectedTextEdit(message)) {
      return;
    }

    toggleEditing(message);
  }

  function startSelectedTextEdit(message: SavedMessage): boolean {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() ?? "";
    const messageElement = getMessageElement(message.id);

    if (!selection || selection.isCollapsed || !selectedText || !messageElement) {
      return false;
    }

    if (!selectionBelongsToElement(selection, messageElement)) {
      return false;
    }

    setEditingMessageId(null);
    setDraftTitle("");
    setDraftMarkdown("");
    clearActiveHeadingSection(message.id);
    setSelectedTextEdit({ messageId: message.id, selectedText, draftText: selectedText });
    return true;
  }

  async function saveEdit(message: SavedMessage) {
    await onSaveMessageEdit(message, draftTitle, draftMarkdown);
    setEditingMessageId(null);
    setDraftTitle("");
    setDraftMarkdown("");
  }

  function formatDraftEdit() {
    setDraftMarkdown((currentMarkdown) => formatPastedNoteMarkdown(currentMarkdown));
  }

  async function saveSelectedTextEdit(message: SavedMessage) {
    if (!selectedTextEdit || selectedTextEdit.messageId !== message.id) {
      return;
    }

    await onSaveSelectedTextEdit(message, selectedTextEdit.selectedText, selectedTextEdit.draftText);
    setSelectedTextEdit(null);
  }

  async function saveInlineMarkdownEdit(message: SavedMessage, contentMarkdown: string) {
    const currentMarkdown = message.contentMarkdown || message.contentText;
    const currentDefaultHeader = getDefaultNoteHeader(currentMarkdown);
    const currentTitle = normalizeNoteHeader(message.title);
    const nextTitle =
      !currentTitle || currentTitle === currentDefaultHeader ? getDefaultNoteHeader(contentMarkdown) : currentTitle;

    await onSaveMessageEdit(message, nextTitle, contentMarkdown);
  }

  async function insertImageIntoDraft(message: SavedMessage, file: File, textarea?: HTMLTextAreaElement | null) {
    const imageMarkdown = await onInsertImage(message, file);

    if (!imageMarkdown) {
      return;
    }

    setDraftMarkdown((currentMarkdown) => {
      if (!textarea) {
        return appendImageMarkdown(currentMarkdown, imageMarkdown);
      }

      const selectionStart = textarea.selectionStart;
      const selectionEnd = textarea.selectionEnd;
      const nextMarkdown = insertMarkdownAtRange(currentMarkdown, imageMarkdown, selectionStart, selectionEnd);
      const nextCursor = selectionStart + imageMarkdown.length + 2;

      window.setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(nextCursor, nextCursor);
      }, 0);

      return nextMarkdown;
    });
  }

  function handleEditorPaste(message: SavedMessage, event: ClipboardEvent<HTMLTextAreaElement>) {
    const file = getFirstImageFile(event.clipboardData?.files);

    if (!file) {
      return;
    }

    event.preventDefault();
    void insertImageIntoDraft(message, file, event.currentTarget);
  }

  function handleEditorDrop(message: SavedMessage, event: DragEvent<HTMLTextAreaElement>) {
    const file = getFirstImageFile(event.dataTransfer.files);

    if (!file) {
      return;
    }

    event.preventDefault();
    void insertImageIntoDraft(message, file, event.currentTarget);
  }

  function cancelEdit() {
    setEditingMessageId(null);
    setDraftTitle("");
    setDraftMarkdown("");
  }

  function cancelSelectedTextEdit() {
    setSelectedTextEdit(null);
  }

  function selectHeadingSection(message: SavedMessage, headingIndex: number) {
    setSelectedTextEdit(null);
    setActiveHeadingSection({ messageId: message.id, headingIndex });
  }

  function clearActiveHeadingSection(messageId: string) {
    setActiveHeadingSection((current) => (current?.messageId === messageId ? null : current));
  }

  function unmakeActiveHeadingSection(message: SavedMessage) {
    if (!activeHeadingSection || activeHeadingSection.messageId !== message.id) {
      return;
    }

    const headingIndex = activeHeadingSection.headingIndex;
    setActiveHeadingSection(null);
    onUnmakeHeadingSection?.(message, headingIndex);
  }

  function toggleCollapse(message: SavedMessage) {
    if (editingMessageId === message.id && !collapsedMessageIds.has(message.id)) {
      cancelEdit();
    }

    if (!collapsedMessageIds.has(message.id)) {
      clearActiveHeadingSection(message.id);
    }

    onCollapsedMessageIdsChange((current) => {
      const next = new Set(current);

      if (next.has(message.id)) {
        next.delete(message.id);
      } else {
        next.add(message.id);
      }

      return next;
    });
  }

  function toggleHeadingCollapse(message: SavedMessage) {
    setHeadingCollapsedMessageIds((current) => {
      const next = new Set(current);

      if (next.has(message.id)) {
        next.delete(message.id);
      } else {
        next.add(message.id);
      }

      return next;
    });
  }

  function getDraggedMessage(event?: DragEvent<HTMLElement>): SavedMessage | null {
    const dataTransferMessageId = event?.dataTransfer.getData("text/plain") || null;
    const messageId = draggingMessageId ?? dataTransferMessageId;

    if (!messageId) {
      return null;
    }

    return messages.find((message) => message.id === messageId) ?? null;
  }

  function getDropPosition(event: DragEvent<HTMLElement>): "before" | "after" {
    const bounds = event.currentTarget.getBoundingClientRect();
    const midpoint = bounds.top + bounds.height / 2;
    return event.clientY < midpoint ? "before" : "after";
  }

  function handleMessageDragStart(message: SavedMessage, event: DragEvent<HTMLElement>) {
    if (!canReorderMessages || editingMessageId === message.id) {
      event.preventDefault();
      return;
    }

    const dragStartTarget = event.target instanceof HTMLElement ? event.target : null;

    if (!dragStartTarget?.closest(".message-collapse-strip")) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", message.id);
    setDraggingMessageId(message.id);
  }

  function handleSelectedTextDragStart(message: SavedMessage, event: DragEvent<HTMLElement>) {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() ?? "";

    if (
      !selection ||
      selection.isCollapsed ||
      !selectedText ||
      !selectionBelongsToElement(selection, event.currentTarget)
    ) {
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", selectedText);
    event.dataTransfer.setData(
      NOTE_SELECTION_DRAG_TYPE,
      encodeNoteSelectionDragPayload({ messageId: message.id, text: selectedText }),
    );
  }

  function handleMessageDragOver(message: SavedMessage, event: DragEvent<HTMLElement>) {
    if (!getDraggedMessage(event)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropTarget({ messageId: message.id, position: getDropPosition(event) });
  }

  function handleMessageDragLeave(message: SavedMessage, event: DragEvent<HTMLElement>) {
    const nextTarget = event.relatedTarget instanceof Node ? event.relatedTarget : null;

    if (nextTarget && event.currentTarget.contains(nextTarget)) {
      return;
    }

    setDropTarget((currentTarget) => (currentTarget?.messageId === message.id ? null : currentTarget));
  }

  function handleMessageDragEnd() {
    setDraggingMessageId(null);
    setDropTarget(null);
  }

  function handleMessageDrop(targetMessage: SavedMessage, event: DragEvent<HTMLElement>) {
    event.preventDefault();

    const draggedMessage = getDraggedMessage(event);
    const targetPosition = dropTarget?.messageId === targetMessage.id ? dropTarget.position : getDropPosition(event);
    setDraggingMessageId(null);
    setDropTarget(null);

    if (!draggedMessage || draggedMessage.id === targetMessage.id) {
      return;
    }

    const targetIndex = messages.findIndex((message) => message.id === targetMessage.id);
    const afterMessageId =
      targetPosition === "before" ? messages[targetIndex - 1]?.id ?? null : targetMessage.id;

    onMoveMessageAfter(draggedMessage, afterMessageId);
  }

  return (
    <ul className="message-list">
      {messages.map((message) => {
        const isEditing = editingMessageId === message.id;
        const isCollapsed = collapsedMessageIds.has(message.id);
        const isDragging = draggingMessageId === message.id;
        const isDropBefore = dropTarget?.messageId === message.id && dropTarget.position === "before";
        const isDropAfter = dropTarget?.messageId === message.id && dropTarget.position === "after";
        const areHeadingsCollapsed = headingCollapsedMessageIds.has(message.id);
        const selectedTextEditor = selectedTextEdit?.messageId === message.id ? selectedTextEdit : null;
        const activeHeadingIndex =
          activeHeadingSection?.messageId === message.id ? activeHeadingSection.headingIndex : null;
        const noteMarkdown = isEditing ? draftMarkdown : message.contentMarkdown || message.contentText;
        const noteHeader = getNoteHeaderParts(noteMarkdown, isEditing ? draftTitle : message.title);
        const isExportTarget = exportTargetMessageId === message.id;
        const exportTargetTitle = isExportTarget ? "Deselect note" : "Select note";

        return (
          <li
            className={`message-row${isEditing ? " is-editing" : ""}${isCollapsed ? " is-collapsed" : ""}${
              canReorderMessages ? " is-draggable" : ""
            }${isSelectingForMerge ? " is-selecting" : ""}${isDragging ? " is-dragging" : ""}${isDropBefore ? " is-drop-before" : ""}${
              isDropAfter ? " is-drop-after" : ""
            }`}
            key={message.id}
            data-note-message-row-id={message.id}
            onDragEnd={handleMessageDragEnd}
            onDragLeave={(event) => handleMessageDragLeave(message, event)}
            onDragOver={(event) => handleMessageDragOver(message, event)}
            onDrop={(event) => handleMessageDrop(message, event)}
          >
            <div className="message-selection-tools">
              {isSelectingForMerge ? (
                <input
                  className="message-select"
                  type="checkbox"
                  aria-label={`Select note to merge: ${noteHeader.header}`}
                  checked={selectedMessageIds.has(message.id)}
                  onChange={() => onToggleMessageSelection(message.id)}
                />
              ) : (
                <button
                  className={`icon-button message-select-note-button${isExportTarget ? " is-active" : ""}`}
                  type="button"
                  title={exportTargetTitle}
                  aria-label={exportTargetTitle}
                  aria-pressed={isExportTarget}
                  onClick={() => onToggleExportTargetMessage(message)}
                >
                  {isExportTarget ? (
                    <SquareCheckBig size={16} aria-hidden="true" />
                  ) : (
                    <Square size={16} aria-hidden="true" />
                  )}
                </button>
              )}
            </div>
            <button
              className="message-collapse-strip"
              type="button"
              draggable={canReorderMessages && !isEditing}
              title={isCollapsed ? "Expand note" : "Collapse note"}
              aria-label={`${isCollapsed ? "Expand note" : "Collapse note"}: ${noteHeader.header}`}
              onClick={() => toggleCollapse(message)}
              onDragEnd={handleMessageDragEnd}
              onDragStart={(event) => handleMessageDragStart(message, event)}
            >
              <span className="message-header-text">{noteHeader.header}</span>
            </button>
            {!isCollapsed ? (
              <article
                className="message-content"
                data-note-message-id={message.id}
                onDragStart={(event) => handleSelectedTextDragStart(message, event)}
              >
                {isEditing ? (
                  <form
                    className="message-editor"
                    onKeyDown={(event) => {
                      if (event.key !== "Escape") {
                        return;
                      }

                      event.preventDefault();
                      cancelEdit();
                    }}
                    onSubmit={(event) => {
                      event.preventDefault();
                      void saveEdit(message);
                    }}
                  >
                    <label className="message-editor-title-field">
                      <span className="sr-only">Note header</span>
                      <input
                        ref={isEditing ? titleInputRef : undefined}
                        className="message-editor-title-input"
                        type="text"
                        value={draftTitle}
                        placeholder={getDefaultNoteHeader(noteMarkdown)}
                        onChange={(event) => setDraftTitle(event.target.value)}
                      />
                    </label>
                    <textarea
                      className="message-editor-textarea"
                      aria-label="Edit note Markdown"
                      value={draftMarkdown}
                      rows={Math.max(8, Math.min(24, draftMarkdown.split("\n").length + 2))}
                      onChange={(event) => setDraftMarkdown(event.target.value)}
                      onDrop={(event) => handleEditorDrop(message, event)}
                      onPaste={(event) => handleEditorPaste(message, event)}
                    />
                    <div className="message-editor-actions">
                      <label className="tool-button secondary message-image-upload-button">
                        <ImagePlus size={16} aria-hidden="true" />
                        Image
                        <input
                          className="sr-only"
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          onChange={(event) => {
                            const file = event.currentTarget.files?.[0] ?? null;
                            event.currentTarget.value = "";

                            if (file) {
                              void insertImageIntoDraft(message, file);
                            }
                          }}
                        />
                      </label>
                      <button
                        className="tool-button secondary"
                        type="button"
                        title="Format pasted text"
                        aria-label="Format pasted text"
                        disabled={!draftMarkdown.trim()}
                        onClick={formatDraftEdit}
                      >
                        <Sparkles size={16} aria-hidden="true" />
                        Format
                      </button>
                      <button className="tool-button" type="submit">
                        Save
                      </button>
                      <button className="tool-button secondary" type="button" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : noteHeader.bodyMarkdown.trim() ? (
                  <>
                    {selectedTextEditor ? (
                      <SelectedTextEditor
                        value={selectedTextEditor.draftText}
                        onChange={(draftText) =>
                          setSelectedTextEdit((current) =>
                            current?.messageId === message.id ? { ...current, draftText } : current,
                          )
                        }
                        onSave={() => void saveSelectedTextEdit(message)}
                        onCancel={cancelSelectedTextEdit}
                      />
                    ) : null}
                    <MarkdownContent
                      markdown={noteHeader.bodyMarkdown}
                      className={threadSource === "deepwiki" ? "rendered-message-deepwiki" : undefined}
                      collapseAllHeadings={areHeadingsCollapsed}
                      selectedHeadingIndex={activeHeadingIndex}
                      loadImageAssetUrl={loadImageAssetUrl}
                      onInsertSection={(headingIndex) => onInsertMessageSection(message, headingIndex)}
                      onDeleteSection={(headingIndex) => onDeleteMessageSection(message, headingIndex)}
                      onSelectHeadingSection={(headingIndex) => selectHeadingSection(message, headingIndex)}
                      onMoveSelectionToSection={(headingIndex, selection) =>
                        onMoveSelectedTextToSection(message, headingIndex, selection)
                      }
                      onMarkdownChange={(nextMarkdown) => saveInlineMarkdownEdit(message, nextMarkdown)}
                    />
                  </>
                ) : null}
              </article>
            ) : null}
            <MessageActions
              message={message}
              isEditing={isEditing}
              areHeadingsCollapsed={areHeadingsCollapsed}
              hasActiveHeadingSection={activeHeadingIndex !== null}
              hasHighlightedSelection={highlightedMessageId === message.id}
              canUndoMessageEdit={undoableMessageIds.has(message.id)}
              canUndoDeletedMessage={canUndoDeletedMessage}
              onToggleHeadings={toggleHeadingCollapse}
              onInsertMessage={onInsertMessage}
              onMakeSelectionHeading={onMakeSelectionHeading}
              onUnmakeHeadingSection={unmakeActiveHeadingSection}
              onEditMessage={handleEditMessage}
              onDeleteMessage={onDeleteMessage}
              onUndoMessageEdit={onUndoMessageEdit}
              onUndoDeletedMessage={onUndoDeletedMessage}
            />
          </li>
        );
      })}
    </ul>
  );
}

function SelectedTextEditor({
  value,
  onChange,
  onSave,
  onCancel,
}: {
  value: string;
  onChange(value: string): void;
  onSave(): void;
  onCancel(): void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.focus();
    textarea.setSelectionRange(0, textarea.value.length);
  }, []);

  return (
    <div className="message-selection-editor">
      <textarea
        ref={textareaRef}
        className="message-selection-editor-textarea"
        aria-label="Edit highlighted text"
        value={value}
        rows={Math.max(3, Math.min(12, value.split("\n").length + 1))}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="message-selection-editor-actions">
        <button className="tool-button" type="button" onClick={onSave}>
          Save
        </button>
        <button className="tool-button secondary" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

type NoteHeaderParts = {
  header: string;
  bodyMarkdown: string;
};

export function getNoteHeaderParts(markdown: string, title?: string | null): NoteHeaderParts {
  const normalizedMarkdown = markdown.replace(/\r\n/g, "\n");
  const customHeader = normalizeNoteHeader(title);

  if (customHeader) {
    return { header: customHeader, bodyMarkdown: normalizedMarkdown.trim() };
  }

  return { header: getDefaultNoteHeader(normalizedMarkdown), bodyMarkdown: normalizedMarkdown.trim() };
}

export function getDefaultNoteHeader(markdown: string): string {
  const normalizedMarkdown = markdown.replace(/\r\n/g, "\n");
  const lines = normalizedMarkdown.split("\n");
  const headerIndex = lines.findIndex((line) => line.trim().length > 0);

  if (headerIndex < 0) {
    return "Empty note";
  }

  const rawHeader = lines[headerIndex].trim();
  return markdownToPlainText(rawHeader) || rawHeader || "Empty note";
}

function normalizeNoteHeader(title: string | null | undefined): string {
  return (title ?? "").replace(/\s+/g, " ").trim();
}

function getMessageElement(messageId: string): HTMLElement | null {
  return (
    Array.from(document.querySelectorAll<HTMLElement>("[data-note-message-id]")).find(
      (element) => element.dataset.noteMessageId === messageId,
    ) ?? null
  );
}

function getMessageRowElement(messageId: string): HTMLElement | null {
  return (
    Array.from(document.querySelectorAll<HTMLElement>("[data-note-message-row-id]")).find(
      (element) => element.dataset.noteMessageRowId === messageId,
    ) ?? null
  );
}

type ScrollElementSnapshot = {
  element: Element;
  left: number;
  top: number;
};

type ScrollSnapshot = {
  elements: ScrollElementSnapshot[];
  windowX: number;
  windowY: number;
};

export function captureScrollSnapshot(anchor: Element | null): ScrollSnapshot {
  const elements: ScrollElementSnapshot[] = [];
  const seenElements = new Set<Element>();
  let element: Element | null = anchor;

  while (element) {
    if (!seenElements.has(element)) {
      seenElements.add(element);
      elements.push({ element, left: element.scrollLeft, top: element.scrollTop });
    }

    element = element.parentElement;
  }

  const scrollingElement = document.scrollingElement;

  if (scrollingElement && !seenElements.has(scrollingElement)) {
    elements.push({ element: scrollingElement, left: scrollingElement.scrollLeft, top: scrollingElement.scrollTop });
  }

  return { elements, windowX: window.scrollX, windowY: window.scrollY };
}

export function restoreScrollSnapshotAfterRender(snapshot: ScrollSnapshot): void {
  restoreScrollSnapshot(snapshot);

  scheduleScrollRestore(() => {
    restoreScrollSnapshot(snapshot);
    scheduleScrollRestore(() => restoreScrollSnapshot(snapshot));
  });
}

function restoreScrollSnapshot(snapshot: ScrollSnapshot) {
  for (const item of snapshot.elements) {
    item.element.scrollLeft = item.left;
    item.element.scrollTop = item.top;
  }

  if (window.scrollX === snapshot.windowX && window.scrollY === snapshot.windowY) {
    return;
  }

  try {
    window.scrollTo(snapshot.windowX, snapshot.windowY);
  } catch {
    // Some test DOMs expose scrollTo without implementing it.
  }
}

function scheduleScrollRestore(callback: () => void) {
  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(callback);
    return;
  }

  window.setTimeout(callback, 0);
}

export function getMessageForKeyboardSelection(
  selection: Selection | null,
  messages: SavedMessage[],
): SavedMessage | null {
  if (!selection || selection.isCollapsed || !selection.toString().trim()) {
    return null;
  }

  const messagesById = new Map(messages.map((message) => [message.id, message]));
  const selectedElement = Array.from(document.querySelectorAll<HTMLElement>("[data-note-message-id]")).find(
    (element) => {
      const messageId = element.dataset.noteMessageId;
      return Boolean(messageId && messagesById.has(messageId) && selectionBelongsToElement(selection, element));
    },
  );

  const messageId = selectedElement?.dataset.noteMessageId;
  return messageId ? messagesById.get(messageId) ?? null : null;
}

export function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(target.closest("input, textarea, select, [contenteditable='true'], [contenteditable='plaintext-only']"));
}

function getFirstImageFile(files: FileList | null | undefined): File | null {
  if (!files) {
    return null;
  }

  return Array.from(files).find((file) => file.type.startsWith("image/")) ?? null;
}

function appendImageMarkdown(markdown: string, imageMarkdown: string): string {
  const trimmed = markdown.trimEnd();
  return trimmed ? `${trimmed}\n\n${imageMarkdown}\n` : `${imageMarkdown}\n`;
}

function insertMarkdownAtRange(markdown: string, insertion: string, start: number, end: number): string {
  const prefix = markdown.slice(0, start).replace(/[ \t]*$/, "");
  const suffix = markdown.slice(end).replace(/^[ \t]*/, "");
  const leadingBreak = prefix && !prefix.endsWith("\n\n") ? (prefix.endsWith("\n") ? "\n" : "\n\n") : "";
  const trailingBreak = suffix && !suffix.startsWith("\n\n") ? (suffix.startsWith("\n") ? "\n" : "\n\n") : "\n";

  return `${prefix}${leadingBreak}${insertion}${trailingBreak}${suffix}`;
}
