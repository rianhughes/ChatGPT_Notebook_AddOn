import { Copy, ListCollapse, Pencil, SendHorizontal, Trash2, Undo2, UnfoldVertical } from "lucide-react";

import type { SavedMessage } from "../../core/models";

type MessageActionsProps = {
  message: SavedMessage;
  isEditing: boolean;
  areHeadingsCollapsed: boolean;
  hasHighlightedSelection: boolean;
  canUndoMessageEdit: boolean;
  canUndoDeletedMessage: boolean;
  onToggleHeadings(message: SavedMessage): void;
  onInsertMessage(message: SavedMessage): void;
  onCopyMessage(message: SavedMessage): void;
  onEditMessage(message: SavedMessage): void;
  onDeleteMessage(message: SavedMessage): void;
  onUndoMessageEdit(message: SavedMessage): void;
  onUndoDeletedMessage(): void;
};

export function MessageActions({
  message,
  isEditing,
  areHeadingsCollapsed,
  hasHighlightedSelection,
  canUndoMessageEdit,
  canUndoDeletedMessage,
  onToggleHeadings,
  onInsertMessage,
  onCopyMessage,
  onEditMessage,
  onDeleteMessage,
  onUndoMessageEdit,
  onUndoDeletedMessage,
}: MessageActionsProps) {
  const undoTitle = canUndoDeletedMessage ? "Undo deleted note" : "Undo last note edit";
  const canUndo = canUndoDeletedMessage || canUndoMessageEdit;
  const insertTitle = hasHighlightedSelection ? "Insert highlighted text into ChatGPT" : "Insert into ChatGPT";

  return (
    <div className="message-actions">
      <button
        className="icon-button"
        type="button"
        title={areHeadingsCollapsed ? "Expand all sections" : "Collapse all sections"}
        aria-label={areHeadingsCollapsed ? "Expand all sections" : "Collapse all sections"}
        onClick={() => onToggleHeadings(message)}
      >
        {areHeadingsCollapsed ? (
          <UnfoldVertical size={16} aria-hidden="true" />
        ) : (
          <ListCollapse size={16} aria-hidden="true" />
        )}
      </button>
      <button
        className="icon-button"
        type="button"
        title="Copy message"
        aria-label="Copy message"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onCopyMessage(message)}
      >
        <Copy size={16} aria-hidden="true" />
      </button>
      <button
        className={`icon-button${isEditing ? " is-active" : ""}`}
        type="button"
        title={isEditing ? "Close editor" : "Edit message"}
        aria-label={isEditing ? "Close editor" : "Edit message"}
        onClick={() => onEditMessage(message)}
      >
        <Pencil size={16} aria-hidden="true" />
      </button>
      <button
        className="icon-button danger"
        type="button"
        title="Delete note"
        aria-label="Delete note"
        onClick={() => onDeleteMessage(message)}
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
      <button
        className="icon-button"
        type="button"
        title={undoTitle}
        aria-label={undoTitle}
        disabled={!canUndo}
        onClick={() => (canUndoDeletedMessage ? onUndoDeletedMessage() : onUndoMessageEdit(message))}
      >
        <Undo2 size={16} aria-hidden="true" />
      </button>
      <button
        className={`icon-button message-insert-button${hasHighlightedSelection ? " has-highlighted-selection" : ""}`}
        type="button"
        title={insertTitle}
        aria-label={insertTitle}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onInsertMessage(message)}
      >
        <SendHorizontal size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
