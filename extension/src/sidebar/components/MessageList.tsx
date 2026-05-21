import { MoveDown, MoveUp, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { markdownToPlainText } from "../../core/markdown";
import type { SavedMessage } from "../../core/models";
import type { MessageMoveDirection } from "../../core/repository";
import { MarkdownContent } from "./MarkdownContent";
import { MessageActions } from "./MessageActions";

type MessageListProps = {
  messages: SavedMessage[];
  selectedMessageIds: Set<string>;
  undoableMessageIds: Set<string>;
  collapsedMessageIds: Set<string>;
  reorderMode: boolean;
  onCollapsedMessageIdsChange(updater: (current: Set<string>) => Set<string>): void;
  onToggleSelection(messageId: string): void;
  onMoveMessage(message: SavedMessage, direction: MessageMoveDirection): void;
  onCopyMessage(message: SavedMessage): void;
  onInsertMessage(message: SavedMessage): void;
  onInsertMessageSection(message: SavedMessage, headingIndex: number): void;
  onSaveMessageEdit(message: SavedMessage, title: string, contentMarkdown: string): Promise<void>;
  onDeleteMessage(message: SavedMessage): void;
  onDeleteMessageSection(message: SavedMessage, headingIndex: number): void;
  onDeleteSelectedText(message: SavedMessage): void;
  onUndoMessageEdit(message: SavedMessage): void;
};

export function MessageList({
  messages,
  selectedMessageIds,
  undoableMessageIds,
  collapsedMessageIds,
  reorderMode,
  onCollapsedMessageIdsChange,
  onToggleSelection,
  onMoveMessage,
  onCopyMessage,
  onInsertMessage,
  onInsertMessageSection,
  onSaveMessageEdit,
  onDeleteMessage,
  onDeleteMessageSection,
  onDeleteSelectedText,
  onUndoMessageEdit,
}: MessageListProps) {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftMarkdown, setDraftMarkdown] = useState("");
  const [headingCollapsedMessageIds, setHeadingCollapsedMessageIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (editingMessageId && collapsedMessageIds.has(editingMessageId)) {
      cancelEdit();
    }
  }, [collapsedMessageIds, editingMessageId]);

  if (messages.length === 0) {
    return <div className="empty-state">No saved messages in this view.</div>;
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

  return (
    <ul className="message-list">
      {messages.map((message, index) => {
        const isEditing = editingMessageId === message.id;
        const isCollapsed = collapsedMessageIds.has(message.id);
        const isSelected = selectedMessageIds.has(message.id);
        const areHeadingsCollapsed = headingCollapsedMessageIds.has(message.id);
        const noteMarkdown = isEditing ? draftMarkdown : message.contentMarkdown || message.contentText;
        const noteHeader = getNoteHeaderParts(noteMarkdown, isEditing ? draftTitle : message.title);

        return (
          <li
            className={`message-row${isEditing ? " is-editing" : ""}${isCollapsed ? " is-collapsed" : ""}${
              reorderMode ? " is-reordering" : ""
            }`}
            key={message.id}
          >
            <div className={`message-selection-tools${reorderMode ? " is-reordering" : ""}`}>
              <input
                className="message-select"
                type="checkbox"
                checked={isSelected}
                aria-label="Select message"
                onChange={() => onToggleSelection(message.id)}
              />
              <button
                className={`icon-button danger message-delete-button${isSelected ? " is-visible" : ""}`}
                type="button"
                title="Delete note"
                aria-label="Delete note"
                aria-hidden={!isSelected}
                disabled={!isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => onDeleteMessage(message)}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
              {reorderMode ? (
                <>
                  <button
                    className="icon-button message-reorder-button"
                    type="button"
                    title="Move note up"
                    aria-label="Move note up"
                    disabled={index === 0}
                    onClick={() => onMoveMessage(message, "up")}
                  >
                    <MoveUp size={16} aria-hidden="true" />
                  </button>
                  <button
                    className="icon-button message-reorder-button"
                    type="button"
                    title="Move note down"
                    aria-label="Move note down"
                    disabled={index === messages.length - 1}
                    onClick={() => onMoveMessage(message, "down")}
                  >
                    <MoveDown size={16} aria-hidden="true" />
                  </button>
                </>
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
                  />
                ) : null}
              </article>
            ) : null}
            <MessageActions
              message={message}
              isEditing={isEditing}
              areHeadingsCollapsed={areHeadingsCollapsed}
              canUndo={undoableMessageIds.has(message.id)}
              onToggleHeadings={toggleHeadingCollapse}
              onInsertMessage={onInsertMessage}
              onCopyMessage={onCopyMessage}
              onEditMessage={toggleEditing}
              onDeleteSelectedText={onDeleteSelectedText}
              onUndoMessageEdit={onUndoMessageEdit}
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
