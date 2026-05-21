import { Copy, ListCollapse, Pencil, Scissors, SendHorizontal, Undo2, UnfoldVertical } from "lucide-react";

import type { SavedMessage } from "../../core/models";

type MessageActionsProps = {
  message: SavedMessage;
  isEditing: boolean;
  areHeadingsCollapsed: boolean;
  canUndo: boolean;
  onToggleHeadings(message: SavedMessage): void;
  onInsertMessage(message: SavedMessage): void;
  onCopyMessage(message: SavedMessage): void;
  onEditMessage(message: SavedMessage): void;
  onDeleteSelectedText(message: SavedMessage): void;
  onUndoMessageEdit(message: SavedMessage): void;
};

export function MessageActions({
  message,
  isEditing,
  areHeadingsCollapsed,
  canUndo,
  onToggleHeadings,
  onInsertMessage,
  onCopyMessage,
  onEditMessage,
  onDeleteSelectedText,
  onUndoMessageEdit,
}: MessageActionsProps) {
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
        className="icon-button"
        type="button"
        title="Delete highlighted text"
        aria-label="Delete highlighted text"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onDeleteSelectedText(message)}
      >
        <Scissors size={16} aria-hidden="true" />
      </button>
      <button
        className="icon-button"
        type="button"
        title="Undo last note edit"
        aria-label="Undo last note edit"
        disabled={!canUndo}
        onClick={() => onUndoMessageEdit(message)}
      >
        <Undo2 size={16} aria-hidden="true" />
      </button>
      <button
        className="icon-button"
        type="button"
        title="Insert into ChatGPT"
        aria-label="Insert into ChatGPT"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onInsertMessage(message)}
      >
        <SendHorizontal size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
