import { ChevronDown, MoveDown, MoveUp, Plus, Search, Trash2 } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";

import type { ChatGptThread } from "../../core/models";
import type { ThreadMoveDirection } from "../../core/repository";
import { SearchBox } from "./SearchBox";

type ThreadListProps = {
  threads: ChatGptThread[];
  filter: string;
  newNotebookTitle: string;
  themeToggle: ReactNode;
  selectedThreadId: string | null;
  onFilterChange(filter: string): void;
  onNewNotebookTitleChange(title: string): void;
  onCreateNotebook(event: FormEvent<HTMLFormElement>): void;
  onSelectThread(threadId: string): void;
  onMoveThread(thread: ChatGptThread, direction: ThreadMoveDirection): void;
  onDeleteThread(thread: ChatGptThread): void;
};

export function ThreadList({
  threads,
  filter,
  newNotebookTitle,
  themeToggle,
  selectedThreadId,
  onFilterChange,
  onNewNotebookTitleChange,
  onCreateNotebook,
  onSelectThread,
  onMoveThread,
  onDeleteThread,
}: ThreadListProps) {
  const normalizedFilter = filter.trim().toLowerCase();
  const visibleThreads = normalizedFilter
    ? threads.filter((thread) => thread.title.toLowerCase().includes(normalizedFilter))
    : threads;
  const emptyMessage = normalizedFilter ? "No notebooks match that search." : "No saved notebooks yet.";
  const [searchOpen, setSearchOpen] = useState(Boolean(normalizedFilter));
  const [createOpen, setCreateOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (normalizedFilter) {
      setSearchOpen(true);
      setCollapsed(false);
    }
  }, [normalizedFilter]);

  return (
    <nav className={`thread-panel${collapsed ? " is-collapsed" : ""}`} aria-labelledby="notebook-list-title">
      <div className="thread-panel-header">
        <button
          className="thread-panel-title-button"
          type="button"
          title={collapsed ? "Show notebooks" : "Hide notebooks"}
          aria-expanded={!collapsed}
          aria-controls="notebook-list-body"
          onClick={() => setCollapsed((isCollapsed) => !isCollapsed)}
        >
          <ChevronDown className="thread-panel-collapse-icon" size={16} aria-hidden="true" />
          <span id="notebook-list-title" className="thread-panel-title">
            Notebooks
          </span>
        </button>
        <div className="thread-panel-actions">
          <button
            className={`icon-button${searchOpen ? " is-active" : ""}`}
            type="button"
            title="Search notebooks"
            aria-label="Search notebooks"
            aria-expanded={searchOpen}
            onClick={() => {
              setCollapsed(false);
              setSearchOpen((isOpen) => !isOpen);
            }}
          >
            <Search size={16} aria-hidden="true" />
          </button>
          <button
            className={`icon-button notebook-create-button${createOpen ? " is-active" : ""}`}
            type="button"
            title="Create notebook"
            aria-label="Create notebook"
            aria-expanded={createOpen}
            onClick={() => {
              setCollapsed(false);
              setCreateOpen((isOpen) => !isOpen);
            }}
          >
            <Plus size={17} aria-hidden="true" />
          </button>
          {themeToggle}
        </div>
      </div>
      {!collapsed && (searchOpen || createOpen) ? (
        <div className="thread-panel-tools">
          {searchOpen ? (
            <SearchBox
              label="Search notebooks"
              placeholder="Search notebooks"
              value={filter}
              onChange={onFilterChange}
            />
          ) : null}
          {createOpen ? (
            <form className="notebook-create-form" onSubmit={onCreateNotebook}>
              <label className="notebook-title-field">
                <span className="sr-only">Notebook name</span>
                <input
                  className="input"
                  type="text"
                  value={newNotebookTitle}
                  placeholder="New notebook"
                  onChange={(event) => onNewNotebookTitleChange(event.target.value)}
                />
              </label>
              <button
                className="icon-button notebook-create-button"
                type="submit"
                title="Create notebook"
                aria-label="Create notebook"
                disabled={!newNotebookTitle.trim()}
              >
                <Plus size={18} aria-hidden="true" />
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
      <div id="notebook-list-body" className="thread-panel-body" hidden={collapsed}>
        {visibleThreads.length === 0 ? (
          <div className="empty-state">{emptyMessage}</div>
        ) : (
          <ul className="thread-list">
            {visibleThreads.map((thread, index) => {
              const messageLabel = `${thread.messageCount} ${
                thread.messageCount === 1 ? "message" : "messages"
              }`;
              const reorderDisabled = Boolean(normalizedFilter);

              return (
                <li key={thread.id}>
                  <div className={`thread-row${selectedThreadId === thread.id ? " is-active" : ""}`}>
                    <button className="thread-button" type="button" onClick={() => onSelectThread(thread.id)}>
                      <span className="thread-title">{thread.title}</span>
                      <span className="thread-meta">
                        {thread.source === "notebook" ? messageLabel : `ChatGPT · ${messageLabel}`}
                      </span>
                    </button>
                    <div className="thread-row-actions">
                      <button
                        className="icon-button thread-reorder-button"
                        type="button"
                        title={reorderDisabled ? "Clear search to reorder notebooks" : "Move notebook up"}
                        aria-label={`Move ${thread.title} up`}
                        disabled={reorderDisabled || index === 0}
                        onClick={() => onMoveThread(thread, "up")}
                      >
                        <MoveUp size={15} aria-hidden="true" />
                      </button>
                      <button
                        className="icon-button thread-reorder-button"
                        type="button"
                        title={reorderDisabled ? "Clear search to reorder notebooks" : "Move notebook down"}
                        aria-label={`Move ${thread.title} down`}
                        disabled={reorderDisabled || index === visibleThreads.length - 1}
                        onClick={() => onMoveThread(thread, "down")}
                      >
                        <MoveDown size={15} aria-hidden="true" />
                      </button>
                      <button
                        className="icon-button danger thread-delete-button"
                        type="button"
                        title="Delete notebook"
                        aria-label={`Delete ${thread.title}`}
                        onClick={() => onDeleteThread(thread)}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </nav>
  );
}
