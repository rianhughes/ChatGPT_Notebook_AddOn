import {
  Check,
  ChevronDown,
  FileDown,
  ListCollapse,
  ListOrdered,
  Merge,
  Pencil,
  Trash2,
  UnfoldVertical,
  X,
} from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import type { ChatGptThread } from "../../core/models";
import type { NotebookExportFormatId, NotebookExportFormatter } from "../../core/notebookExport";
import { SearchBox } from "./SearchBox";

type ToolbarProps = {
  selectedThread: ChatGptThread | null;
  searchQuery: string;
  selectedCount: number;
  canCollapseMessages: boolean;
  areAllMessagesCollapsed: boolean;
  canReorderMessages: boolean;
  isReorderingMessages: boolean;
  exportFormats: readonly NotebookExportFormatter[];
  onSearchChange(value: string): void;
  onRenameThread(threadId: string, title: string): Promise<void>;
  onRequestExport(formatId: NotebookExportFormatId): void;
  onToggleAllMessagesCollapsed(): void;
  onToggleMessageReorder(): void;
  onMergeSelectedMessages(): void;
  onDeleteSelectedMessages(): void;
};

export function Toolbar({
  selectedThread,
  searchQuery,
  selectedCount,
  canCollapseMessages,
  areAllMessagesCollapsed,
  canReorderMessages,
  isReorderingMessages,
  exportFormats,
  onSearchChange,
  onRenameThread,
  onRequestExport,
  onToggleAllMessagesCollapsed,
  onToggleMessageReorder,
  onMergeSelectedMessages,
  onDeleteSelectedMessages,
}: ToolbarProps) {
  const [messageToolsOpen, setMessageToolsOpen] = useState(Boolean(searchQuery.trim()));
  const [editingTitle, setEditingTitle] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const selectedThreadMeta = selectedThread
    ? `${selectedThread.messageCount} saved ${selectedThread.messageCount === 1 ? "message" : "messages"}`
    : null;
  const messageCollapseToggleLabel = areAllMessagesCollapsed ? "Expand all notes" : "Collapse all notes";
  const messageReorderToggleLabel = isReorderingMessages ? "Done reordering notes" : "Reorder notes";

  useEffect(() => {
    if (searchQuery.trim()) {
      setMessageToolsOpen(true);
    }
  }, [searchQuery]);

  useEffect(() => {
    setEditingTitle(selectedThread?.title ?? "");
    setIsRenaming(false);
    setExportMenuOpen(false);
  }, [selectedThread?.id, selectedThread?.title]);

  function requestExport(formatId: NotebookExportFormatId) {
    setExportMenuOpen(false);
    onRequestExport(formatId);
  }

  function startRename() {
    if (!selectedThread) {
      return;
    }

    setEditingTitle(selectedThread.title);
    setIsRenaming(true);
  }

  function cancelRename() {
    setEditingTitle(selectedThread?.title ?? "");
    setIsRenaming(false);
  }

  async function submitRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedThread) {
      cancelRename();
      return;
    }

    const nextTitle = editingTitle.trim();

    if (!nextTitle || nextTitle === selectedThread.title) {
      cancelRename();
      return;
    }

    await onRenameThread(selectedThread.id, nextTitle);
    setIsRenaming(false);
  }

  return (
    <section className="message-toolbar" aria-label="Message tools">
      <section className={`message-tools-box${messageToolsOpen ? " is-open" : ""}`}>
        <div className="message-tools-header">
          {isRenaming ? (
            <form className="selected-thread-rename-form" onSubmit={(event) => void submitRename(event)}>
              <label className="sr-only" htmlFor="selected-thread-title">
                Edit notebook name
              </label>
              <input
                id="selected-thread-title"
                className="input selected-thread-rename-input"
                type="text"
                value={editingTitle}
                onChange={(event) => setEditingTitle(event.target.value)}
                autoFocus
              />
              <button
                className="icon-button"
                type="submit"
                title="Save name"
                aria-label="Save name"
                disabled={!editingTitle.trim()}
              >
                <Check size={16} aria-hidden="true" />
              </button>
              <button
                className="icon-button"
                type="button"
                title="Cancel edit"
                aria-label="Cancel edit"
                onClick={cancelRename}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </form>
          ) : (
            <>
              <button
                className="message-tools-title-button"
                type="button"
                aria-expanded={messageToolsOpen}
                aria-controls="message-tools-body"
                onClick={() => setMessageToolsOpen((isOpen) => !isOpen)}
              >
                <span className="message-tools-title-group">
                  <span className="selected-thread-title">{selectedThread?.title ?? "No thread selected"}</span>
                  {selectedThreadMeta ? <span className="selected-thread-meta">{selectedThreadMeta}</span> : null}
                </span>
              </button>
              <div className="export-menu-wrapper">
                <button
                  className="icon-button selected-thread-export-button"
                  type="button"
                  title="Export notebook"
                  aria-label="Export notebook"
                  aria-haspopup="menu"
                  aria-expanded={exportMenuOpen}
                  disabled={!selectedThread}
                  onClick={() => setExportMenuOpen((isOpen) => !isOpen)}
                >
                  <FileDown size={16} aria-hidden="true" />
                </button>
                {exportMenuOpen ? (
                  <div className="export-format-menu" role="menu" aria-label="Export format">
                    {exportFormats.map((format) => (
                      <button
                        key={format.id}
                        className="export-format-menu-item"
                        type="button"
                        role="menuitem"
                        onClick={() => requestExport(format.id)}
                      >
                        {format.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <button
                className="icon-button selected-thread-collapse-notes-button"
                type="button"
                title={messageCollapseToggleLabel}
                aria-label={messageCollapseToggleLabel}
                disabled={!canCollapseMessages}
                onClick={onToggleAllMessagesCollapsed}
              >
                {areAllMessagesCollapsed ? (
                  <UnfoldVertical size={16} aria-hidden="true" />
                ) : (
                  <ListCollapse size={16} aria-hidden="true" />
                )}
              </button>
              <button
                className="icon-button selected-thread-edit-button"
                type="button"
                title="Edit name"
                aria-label="Edit name"
                disabled={!selectedThread}
                onClick={startRename}
              >
                <Pencil size={16} aria-hidden="true" />
              </button>
              <button
                className="icon-button message-tools-collapse-button"
                type="button"
                title={messageToolsOpen ? "Hide message tools" : "Show message tools"}
                aria-label={messageToolsOpen ? "Hide message tools" : "Show message tools"}
                aria-expanded={messageToolsOpen}
                aria-controls="message-tools-body"
                onClick={() => setMessageToolsOpen((isOpen) => !isOpen)}
              >
                <ChevronDown className="collapse-icon" size={16} aria-hidden="true" />
              </button>
            </>
          )}
        </div>
        <div id="message-tools-body" className="message-tools-body" hidden={!messageToolsOpen}>
          <SearchBox
            label="Search saved messages"
            placeholder="Search messages"
            value={searchQuery}
            onChange={onSearchChange}
          />
          <div className="message-tools-actions">
            <button
              className="tool-button secondary"
              type="button"
              disabled={selectedCount < 2}
              onClick={onMergeSelectedMessages}
              title="Merge selected notes"
            >
              <Merge size={16} aria-hidden="true" />
              Merge selected
            </button>
            <button
              className="tool-button secondary"
              type="button"
              disabled={selectedCount === 0}
              onClick={onDeleteSelectedMessages}
              title="Delete selected notes"
            >
              <Trash2 size={16} aria-hidden="true" />
              Delete selected
            </button>
            <button
              className={`tool-button secondary selected-thread-reorder-notes-button${
                isReorderingMessages ? " is-active" : ""
              }`}
              type="button"
              title={messageReorderToggleLabel}
              aria-label={messageReorderToggleLabel}
              aria-pressed={isReorderingMessages}
              disabled={!canReorderMessages}
              onClick={onToggleMessageReorder}
            >
              <ListOrdered size={16} aria-hidden="true" />
              {isReorderingMessages ? "Done reordering" : "Reorder notes"}
            </button>
          </div>
        </div>
      </section>
    </section>
  );
}
