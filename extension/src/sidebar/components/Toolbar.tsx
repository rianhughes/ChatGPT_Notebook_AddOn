import {
  AppWindow,
  Bot,
  Check,
  FileDown,
  Merge,
  Pencil,
  Plus,
  Undo2,
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
  canMergeMessages: boolean;
  mergeMode: boolean;
  selectedMergeCount: number;
  canUndoNotebook: boolean;
  toolsOpen: boolean;
  exportFormats: readonly NotebookExportFormatter[];
  onSearchChange(value: string): void;
  onToolsOpenChange(open: boolean): void;
  onRenameThread(threadId: string, title: string): Promise<void>;
  onRequestExport(formatId: NotebookExportFormatId): void;
  onRequestPrintExport(): void;
  onCreateNote(): void;
  onInsertEditableContext(): void;
  onUndoNotebook(): void;
  onOpenStandaloneWindow(): void;
  onStartMergeSelection(): void;
  onConfirmMergeSelection(): void;
  onCancelMergeSelection(): void;
};

export function Toolbar({
  selectedThread,
  searchQuery,
  canMergeMessages,
  mergeMode,
  selectedMergeCount,
  canUndoNotebook,
  toolsOpen,
  exportFormats,
  onSearchChange,
  onToolsOpenChange,
  onRenameThread,
  onRequestExport,
  onRequestPrintExport,
  onCreateNote,
  onInsertEditableContext,
  onUndoNotebook,
  onOpenStandaloneWindow,
  onStartMergeSelection,
  onConfirmMergeSelection,
  onCancelMergeSelection,
}: ToolbarProps) {
  const [editingTitle, setEditingTitle] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  useEffect(() => {
    if (searchQuery.trim()) {
      onToolsOpenChange(true);
    }
  }, [onToolsOpenChange, searchQuery]);

  useEffect(() => {
    setEditingTitle(selectedThread?.title ?? "");
    setIsRenaming(false);
    setExportMenuOpen(false);
  }, [selectedThread?.id, selectedThread?.title]);

  function requestExport(formatId: NotebookExportFormatId) {
    setExportMenuOpen(false);
    onRequestExport(formatId);
  }

  function requestPrintExport() {
    setExportMenuOpen(false);
    onRequestPrintExport();
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
    <section id="message-tools-panel" className="message-toolbar" aria-label="Notebook tools" hidden={!toolsOpen}>
      <section className="message-tools-box">
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
          <div id="message-tools-body" className="message-tools-body">
            <SearchBox
              label="Search saved messages"
              placeholder="Search messages"
              value={searchQuery}
              onChange={onSearchChange}
            />
            <div className="message-tools-actions">
              <div className="message-tools-action-row">
                <button
                  className="tool-button secondary selected-thread-new-note-button"
                  type="button"
                  title="Create new note"
                  aria-label="Create new note"
                  disabled={!selectedThread}
                  onClick={onCreateNote}
                >
                  <Plus size={16} aria-hidden="true" />
                  New note
                </button>
                <button
                  className="tool-button secondary selected-thread-ai-context-button"
                  type="button"
                  title="Send editable notebook context to ChatGPT"
                  aria-label="Send editable notebook context to ChatGPT"
                  disabled={!selectedThread}
                  onClick={onInsertEditableContext}
                >
                  <Bot size={16} aria-hidden="true" />
                  AI context
                </button>
                {mergeMode ? (
                  <>
                    <button
                      className="tool-button secondary selected-thread-merge-notes-button is-active"
                      type="button"
                      title="Merge selected notes"
                      aria-label="Merge selected notes"
                      disabled={selectedMergeCount < 2}
                      onClick={onConfirmMergeSelection}
                    >
                      <Merge size={16} aria-hidden="true" />
                      Merge selected
                    </button>
                    <button
                      className="tool-button secondary selected-thread-cancel-merge-button"
                      type="button"
                      title="Cancel merge"
                      aria-label="Cancel merge"
                      onClick={onCancelMergeSelection}
                    >
                      <X size={16} aria-hidden="true" />
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className="tool-button secondary selected-thread-merge-notes-button"
                    type="button"
                    title="Merge notes"
                    aria-label="Merge notes"
                    disabled={!selectedThread || !canMergeMessages}
                    onClick={onStartMergeSelection}
                  >
                    <Merge size={16} aria-hidden="true" />
                    Merge notes
                  </button>
                )}
                <button
                  className="tool-button secondary selected-thread-edit-button"
                  type="button"
                  title="Edit name"
                  disabled={!selectedThread}
                  onClick={startRename}
                >
                  <Pencil size={16} aria-hidden="true" />
                  Edit name
                </button>
                <button
                  className="tool-button secondary selected-thread-undo-button"
                  type="button"
                  title="Undo notebook change"
                  aria-label="Undo notebook change"
                  disabled={!canUndoNotebook}
                  onClick={onUndoNotebook}
                >
                  <Undo2 size={16} aria-hidden="true" />
                  Undo
                </button>
              </div>
              <div className="message-tools-action-row">
                <button
                  className="tool-button secondary selected-thread-window-button"
                  type="button"
                  title="Open in window"
                  onClick={onOpenStandaloneWindow}
                >
                  <AppWindow size={16} aria-hidden="true" />
                  Open in window
                </button>
                <div className="export-menu-wrapper">
                  <button
                    className="tool-button secondary selected-thread-export-button"
                    type="button"
                    title="Export notebook"
                    aria-label="Export notebook"
                    aria-haspopup="menu"
                    aria-expanded={exportMenuOpen}
                    disabled={!selectedThread}
                    onClick={() => setExportMenuOpen((isOpen) => !isOpen)}
                  >
                    <FileDown size={16} aria-hidden="true" />
                    Export notebook
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
                      <button
                        className="export-format-menu-item"
                        type="button"
                        role="menuitem"
                        onClick={requestPrintExport}
                      >
                        PDF
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </section>
  );
}
