import { GripVertical, Undo2 } from "lucide-react";
import type { DragEvent } from "react";
import { useEffect, useState } from "react";

import { markdownToPlainText } from "../../core/markdown";
import type { SavedMessage } from "../../core/models";
import { selectionBelongsToElement } from "../insertSelection";
import { MarkdownContent } from "./MarkdownContent";
import { MessageActions } from "./MessageActions";

type MessageListProps = {
  messages: SavedMessage[];
  undoableMessageIds: Set<string>;
  canUndoDeletedMessage: boolean;
  selectedMessageIds: Set<string>;
  isSelectingForMerge: boolean;
  collapsedMessageIds: Set<string>;
  canReorderMessages: boolean;
  onCollapsedMessageIdsChange(updater: (current: Set<string>) => Set<string>): void;
  onToggleMessageSelection(messageId: string): void;
  onMoveMessageAfter(message: SavedMessage, afterMessageId: string | null): void;
  onCopyMessage(message: SavedMessage): void;
  onInsertMessage(message: SavedMessage): void;
  onInsertMessageSection(message: SavedMessage, headingIndex: number): void;
  onSaveMessageEdit(message: SavedMessage, title: string, contentMarkdown: string): Promise<void>;
  onDeleteMessage(message: SavedMessage): void;
  onDeleteMessageSection(message: SavedMessage, headingIndex: number): void;
  onDeleteSelectedText(message: SavedMessage): void;
  onUndoMessageEdit(message: SavedMessage): void;
  onUndoDeletedMessage(): void;
};

export function MessageList({
  messages,
  undoableMessageIds,
  canUndoDeletedMessage,
  selectedMessageIds,
  isSelectingForMerge,
  collapsedMessageIds,
  canReorderMessages,
  onCollapsedMessageIdsChange,
  onToggleMessageSelection,
  onMoveMessageAfter,
  onCopyMessage,
  onInsertMessage,
  onInsertMessageSection,
  onSaveMessageEdit,
  onDeleteMessage,
  onDeleteMessageSection,
  onDeleteSelectedText,
  onUndoMessageEdit,
  onUndoDeletedMessage,
}: MessageListProps) {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftMarkdown, setDraftMarkdown] = useState("");
  const [headingCollapsedMessageIds, setHeadingCollapsedMessageIds] = useState<Set<string>>(() => new Set());
  const [draggingMessageId, setDraggingMessageId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ messageId: string; position: "before" | "after" } | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  useEffect(() => {
    if (editingMessageId && collapsedMessageIds.has(editingMessageId)) {
      cancelEdit();
    }
  }, [collapsedMessageIds, editingMessageId]);

  useEffect(() => {
    function deleteSelectedTextOnBackspace(event: globalThis.KeyboardEvent) {
      if (event.key !== "Backspace" || event.defaultPrevented || isEditableKeyboardTarget(event.target)) {
        return;
      }

      const message = getMessageForKeyboardSelection(window.getSelection(), messages);

      if (!message) {
        return;
      }

      event.preventDefault();
      onDeleteSelectedText(message);
    }

    window.addEventListener("keydown", deleteSelectedTextOnBackspace);
    return () => window.removeEventListener("keydown", deleteSelectedTextOnBackspace);
  }, [messages, onDeleteSelectedText]);

  useEffect(() => {
    function updateHighlightedMessage() {
      const messageId = getMessageForKeyboardSelection(window.getSelection(), messages)?.id ?? null;
      setHighlightedMessageId((currentMessageId) => (currentMessageId === messageId ? currentMessageId : messageId));
    }

    updateHighlightedMessage();
    document.addEventListener("selectionchange", updateHighlightedMessage);
    return () => document.removeEventListener("selectionchange", updateHighlightedMessage);
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

  function toggleEditing(message: SavedMessage) {
    if (editingMessageId === message.id) {
      cancelEdit();
      return;
    }

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

  async function saveEdit(message: SavedMessage) {
    await onSaveMessageEdit(message, draftTitle, draftMarkdown);
    setEditingMessageId(null);
    setDraftTitle("");
    setDraftMarkdown("");
  }

  async function saveInlineMarkdownEdit(message: SavedMessage, contentMarkdown: string) {
    const currentMarkdown = message.contentMarkdown || message.contentText;
    const currentDefaultHeader = getDefaultNoteHeader(currentMarkdown);
    const currentTitle = normalizeNoteHeader(message.title);
    const nextTitle =
      !currentTitle || currentTitle === currentDefaultHeader ? getDefaultNoteHeader(contentMarkdown) : currentTitle;

    await onSaveMessageEdit(message, nextTitle, contentMarkdown);
  }

  function cancelEdit() {
    setEditingMessageId(null);
    setDraftTitle("");
    setDraftMarkdown("");
  }

  function toggleCollapse(message: SavedMessage) {
    if (editingMessageId === message.id && !collapsedMessageIds.has(message.id)) {
      cancelEdit();
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

    if (!dragStartTarget?.closest(".message-drag-handle")) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", message.id);
    setDraggingMessageId(message.id);
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
        const noteMarkdown = isEditing ? draftMarkdown : message.contentMarkdown || message.contentText;
        const noteHeader = getNoteHeaderParts(noteMarkdown, isEditing ? draftTitle : message.title);

        return (
          <li
            className={`message-row${isEditing ? " is-editing" : ""}${isCollapsed ? " is-collapsed" : ""}${
              canReorderMessages ? " is-draggable" : ""
            }${isSelectingForMerge ? " is-selecting" : ""}${isDragging ? " is-dragging" : ""}${isDropBefore ? " is-drop-before" : ""}${
              isDropAfter ? " is-drop-after" : ""
            }`}
            key={message.id}
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
              ) : canReorderMessages ? (
                <span
                  className="message-drag-handle"
                  draggable={!isEditing}
                  title="Drag note to reorder"
                  aria-hidden="true"
                  onDragEnd={handleMessageDragEnd}
                  onDragStart={(event) => handleMessageDragStart(message, event)}
                >
                  <GripVertical size={16} aria-hidden="true" />
                </span>
              ) : null}
            </div>
            <button
              className="message-collapse-strip"
              type="button"
              title={isCollapsed ? "Expand note" : "Collapse note"}
              aria-label={`${isCollapsed ? "Expand note" : "Collapse note"}: ${noteHeader.header}`}
              onClick={() => toggleCollapse(message)}
            >
              <span className="message-header-text">{noteHeader.header}</span>
            </button>
            {!isCollapsed ? (
              <article className="message-content" data-note-message-id={message.id}>
                {isEditing ? (
                  <div className="message-editor">
                    <label className="message-editor-title-field">
                      <span className="sr-only">Note header</span>
                      <input
                        className="message-editor-title-input"
                        type="text"
                        value={draftTitle}
                        placeholder={getDefaultNoteHeader(noteMarkdown)}
                        onChange={(event) => setDraftTitle(event.target.value)}
                      />
                    </label>
                    <textarea
                      className="message-editor-textarea"
                      value={draftMarkdown}
                      rows={Math.max(8, Math.min(24, draftMarkdown.split("\n").length + 2))}
                      onChange={(event) => setDraftMarkdown(event.target.value)}
                    />
                    <div className="message-editor-actions">
                      <button className="tool-button" type="button" onClick={() => void saveEdit(message)}>
                        Save
                      </button>
                      <button className="tool-button secondary" type="button" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : noteHeader.bodyMarkdown.trim() ? (
                  <MarkdownContent
                    markdown={noteHeader.bodyMarkdown}
                    collapseAllHeadings={areHeadingsCollapsed}
                    onInsertSection={(headingIndex) => onInsertMessageSection(message, headingIndex)}
                    onDeleteSection={(headingIndex) => onDeleteMessageSection(message, headingIndex)}
                    onMarkdownChange={(nextMarkdown) => saveInlineMarkdownEdit(message, nextMarkdown)}
                  />
                ) : null}
              </article>
            ) : null}
            <MessageActions
              message={message}
              isEditing={isEditing}
              areHeadingsCollapsed={areHeadingsCollapsed}
              hasHighlightedSelection={highlightedMessageId === message.id}
              canUndoMessageEdit={undoableMessageIds.has(message.id)}
              canUndoDeletedMessage={canUndoDeletedMessage}
              onToggleHeadings={toggleHeadingCollapse}
              onInsertMessage={onInsertMessage}
              onCopyMessage={onCopyMessage}
              onEditMessage={toggleEditing}
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
