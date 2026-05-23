import {
  Heading2,
  ListCollapse,
  Pencil,
  SendHorizontal,
  Trash2,
  Undo2,
  UnfoldVertical,
} from "lucide-react";

import type { SavedMessage } from "../../core/models";
import { BackToTopButton } from "./BackToTopButton";

type MessageActionsProps = {
  message: SavedMessage;
  isEditing: boolean;
  areHeadingsCollapsed: boolean;
  hasActiveHeadingSection: boolean;
  hasHighlightedSelection: boolean;
  canUndoMessageEdit: boolean;
  canUndoDeletedMessage: boolean;
  onToggleHeadings(message: SavedMessage): void;
  onInsertMessage(message: SavedMessage): void;
  onMakeSelectionHeading(message: SavedMessage): void;
  onUnmakeHeadingSection(message: SavedMessage): void;
  onEditMessage(message: SavedMessage): void;
  onDeleteMessage(message: SavedMessage): void;
  onUndoMessageEdit(message: SavedMessage): void;
  onUndoDeletedMessage(): void;
};

export function MessageActions({
  message,
  isEditing,
  areHeadingsCollapsed,
  hasActiveHeadingSection,
  hasHighlightedSelection,
  canUndoMessageEdit,
  canUndoDeletedMessage,
  onToggleHeadings,
  onInsertMessage,
  onMakeSelectionHeading,
  onUnmakeHeadingSection,
  onEditMessage,
  onDeleteMessage,
  onUndoMessageEdit,
  onUndoDeletedMessage,
}: MessageActionsProps) {
  const undoTitle = canUndoDeletedMessage ? "Undo deleted note" : "Undo last note edit";
  const canUndo = canUndoDeletedMessage || canUndoMessageEdit;
  const insertTitle = hasHighlightedSelection ? "Insert highlighted text into ChatGPT" : "Insert into ChatGPT";
  const editTitle = hasHighlightedSelection ? "Edit highlighted text" : isEditing ? "Close editor" : "Edit message";
  const headingTitle = hasActiveHeadingSection
    ? "Unmake selected collapsible header"
    : hasHighlightedSelection
      ? "Make highlighted text a collapsible header"
      : "Highlight text to make a collapsible header";

  return (
    <div className="message-actions">
      <div className="message-actions-row message-actions-primary-row">
        <BackToTopButton />
        <button
          className={`icon-button message-edit-button${isEditing ? " is-active" : ""}${
            hasHighlightedSelection ? " has-highlighted-selection" : ""
          }`}
          type="button"
          title={editTitle}
          aria-label={editTitle}
          onMouseDown={(event) => event.preventDefault()}
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
      <div className="message-actions-row message-actions-secondary-row">
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
          className={`icon-button message-heading-button${hasActiveHeadingSection ? " is-active" : ""}${
            hasHighlightedSelection ? " has-highlighted-selection" : ""
          }`}
          type="button"
          title={headingTitle}
          aria-label={headingTitle}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => (hasActiveHeadingSection ? onUnmakeHeadingSection(message) : onMakeSelectionHeading(message))}
        >
          <Heading2 size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
