import {
  Check,
  ChevronDown,
  ChevronRight,
  FileDown,
  FileUp,
  Folder,
  FolderPlus,
  GripVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type { DragEvent, FormEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import type { ChatGptThread, NotebookFolder } from "../../core/models";
import { SearchBox } from "./SearchBox";

const NO_FOLDER_DROP_TARGET = "__no-folder__";
const THREAD_DRAG_DATA_TYPE = "application/x-chatgpt-notebook-thread-id";
const FOLDER_DRAG_DATA_TYPE = "application/x-chatgpt-notebook-folder-id";

type FolderDropTarget = string | typeof NO_FOLDER_DROP_TARGET;

type ThreadListProps = {
  threads: ChatGptThread[];
  folders: NotebookFolder[];
  filter: string;
  newNotebookTitle: string;
  newFolderTitle: string;
  themeToggle: ReactNode;
  autosaveControl?: ReactNode;
  cloudAccountControl?: ReactNode;
  cloudBackupControl?: ReactNode;
  selectedThreadId: string | null;
  isFullPage?: boolean;
  onFilterChange(filter: string): void;
  onNewNotebookTitleChange(title: string): void;
  onNewFolderTitleChange(title: string): void;
  onCreateNotebook(event: FormEvent<HTMLFormElement>): void;
  onCreateFolder(event: FormEvent<HTMLFormElement>): void;
  onSelectThread(threadId: string): void;
  onRenameThread(threadId: string, title: string): void;
  onRenameFolder(folderId: string, title: string): void;
  onMoveThreadToFolder(thread: ChatGptThread, folderId: string | null): void;
  onMoveThreadAfter(thread: ChatGptThread, afterThreadId: string | null): void;
  onMoveFolderAfter(folder: NotebookFolder, afterFolderId: string | null): void;
  onDeleteThread(thread: ChatGptThread): void;
  onDeleteFolder(folder: NotebookFolder): void;
  onExportBackup(): void;
  onImportBackup(file: File): void;
};

export function ThreadList({
  threads,
  folders,
  filter,
  newNotebookTitle,
  newFolderTitle,
  themeToggle,
  autosaveControl,
  cloudAccountControl,
  cloudBackupControl,
  selectedThreadId,
  isFullPage = false,
  onFilterChange,
  onNewNotebookTitleChange,
  onNewFolderTitleChange,
  onCreateNotebook,
  onCreateFolder,
  onSelectThread,
  onRenameThread,
  onRenameFolder,
  onMoveThreadToFolder,
  onMoveThreadAfter,
  onMoveFolderAfter,
  onDeleteThread,
  onDeleteFolder,
  onExportBackup,
  onImportBackup,
}: ThreadListProps) {
  const normalizedFilter = filter.trim().toLowerCase();
  const visibleThreads = normalizedFilter
    ? threads.filter((thread) => thread.title.toLowerCase().includes(normalizedFilter))
    : threads;
  const emptyMessage = normalizedFilter ? "No notebooks match that search." : "No saved notebooks yet.";
  const folderIds = new Set(folders.map((folder) => folder.id));
  const shouldGroupThreads = isFullPage && folders.length > 0;
  const canDragThreads = shouldGroupThreads;
  const canDragFolders = shouldGroupThreads && !normalizedFilter;
  const unfiledThreads = visibleThreads.filter((thread) => getThreadFolderId(thread) === null);
  const [searchOpen, setSearchOpen] = useState(Boolean(normalizedFilter));
  const [createOpen, setCreateOpen] = useState(false);
  const [folderCreateOpen, setFolderCreateOpen] = useState(false);
  const [notebookBarExpanded, setNotebookBarExpanded] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [folderExpansionOverrides, setFolderExpansionOverrides] = useState<Map<FolderDropTarget, boolean>>(
    () => new Map(),
  );
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingThreadTitle, setEditingThreadTitle] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderTitle, setEditingFolderTitle] = useState("");
  const [draggingThreadId, setDraggingThreadId] = useState<string | null>(null);
  const [draggingFolderId, setDraggingFolderId] = useState<string | null>(null);
  const [dragOverFolderTarget, setDragOverFolderTarget] = useState<FolderDropTarget | null>(null);
  const [dropTargetThread, setDropTargetThread] = useState<{
    threadId: string;
    position: "before" | "after";
  } | null>(null);
  const [dropTargetFolder, setDropTargetFolder] = useState<{
    folderId: string;
    position: "before" | "after";
  } | null>(null);
  const [pendingCreateFocus, setPendingCreateFocus] = useState<"notebook" | "folder" | null>(null);
  const [focusedCreateInput, setFocusedCreateInput] = useState<"notebook" | "folder" | null>(null);
  const backupImportInputRef = useRef<HTMLInputElement | null>(null);
  const notebookTitleInputRef = useRef<HTMLInputElement | null>(null);
  const folderTitleInputRef = useRef<HTMLInputElement | null>(null);
  const canCollapse = !isFullPage;
  const panelCollapsed = canCollapse && collapsed;
  const backupToolsOpen = isFullPage && notebookBarExpanded;
  const toolsOpen = !panelCollapsed && (searchOpen || createOpen || folderCreateOpen || backupToolsOpen);
  const notebookCreateExpanded = isFullPage ? notebookBarExpanded : createOpen;
  const folderCreateExpanded = isFullPage ? notebookBarExpanded : folderCreateOpen;
  const notebookCreateActive = focusedCreateInput === "notebook";
  const folderCreateActive = focusedCreateInput === "folder";

  useEffect(() => {
    if (normalizedFilter) {
      setSearchOpen(true);
      setCollapsed(false);
      setFolderExpansionOverrides(new Map());
    }
  }, [normalizedFilter]);

  useEffect(() => {
    if (!pendingCreateFocus) {
      return;
    }

    const input = pendingCreateFocus === "notebook" ? notebookTitleInputRef.current : folderTitleInputRef.current;

    if (!input) {
      return;
    }

    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
    setPendingCreateFocus(null);
  }, [createOpen, folderCreateOpen, notebookBarExpanded, pendingCreateFocus, toolsOpen]);

  function openNotebookCreate() {
    setCollapsed(false);
    setNotebookBarExpanded(isFullPage);
    setCreateOpen(!isFullPage);
    setFolderCreateOpen(false);
    setPendingCreateFocus("notebook");
  }

  function openFolderCreate() {
    setCollapsed(false);
    setNotebookBarExpanded(true);
    setCreateOpen(false);
    setFolderCreateOpen(false);
    setPendingCreateFocus("folder");
  }

  function toggleNotebookBarExpanded() {
    if (notebookBarExpanded) {
      setFocusedCreateInput(null);
      setPendingCreateFocus(null);
    }

    setNotebookBarExpanded((isExpanded) => !isExpanded);
  }

  function getThreadFolderId(thread: ChatGptThread): string | null {
    return thread.folderId && folderIds.has(thread.folderId) ? thread.folderId : null;
  }

  function getFolderIdFromDropTarget(target: FolderDropTarget): string | null {
    return target === NO_FOLDER_DROP_TARGET ? null : target;
  }

  function getDraggedThread(event?: DragEvent<HTMLElement>): ChatGptThread | null {
    const dataTransferThreadId =
      event?.dataTransfer.getData(THREAD_DRAG_DATA_TYPE) || event?.dataTransfer.getData("text/plain") || null;
    const threadId = draggingThreadId ?? dataTransferThreadId;

    if (!threadId) {
      return null;
    }

    return threads.find((thread) => thread.id === threadId) ?? null;
  }

  function getDraggedFolder(event?: DragEvent<HTMLElement>): NotebookFolder | null {
    const dataTransferFolderId =
      event?.dataTransfer.getData(FOLDER_DRAG_DATA_TYPE) || event?.dataTransfer.getData("text/plain") || null;
    const folderId = draggingFolderId ?? dataTransferFolderId;

    if (!folderId) {
      return null;
    }

    return folders.find((folder) => folder.id === folderId) ?? null;
  }

  function getDropPosition(event: DragEvent<HTMLElement>): "before" | "after" {
    const bounds = event.currentTarget.getBoundingClientRect();
    const midpoint = bounds.top + bounds.height / 2;
    return event.clientY < midpoint ? "before" : "after";
  }

  function getFolderGroupClassName(target: FolderDropTarget): string {
    const classes = ["folder-group"];

    if (draggingThreadId) {
      classes.push("is-drop-target");
    }

    if (draggingFolderId && target !== NO_FOLDER_DROP_TARGET) {
      classes.push("is-folder-sort-target");
    }

    if (draggingFolderId === target) {
      classes.push("is-dragging");
    }

    if (dragOverFolderTarget === target) {
      classes.push("is-drag-over");
    }

    if (dropTargetFolder?.folderId === target) {
      classes.push(dropTargetFolder.position === "before" ? "is-drop-before" : "is-drop-after");
    }

    if (isFolderCollapsed(target)) {
      classes.push("is-collapsed");
    }

    return classes.join(" ");
  }

  function isFolderCollapsed(target: FolderDropTarget): boolean {
    return getFolderCollapsedFromOverrides(target, folderExpansionOverrides);
  }

  function getFolderCollapsedFromOverrides(
    target: FolderDropTarget,
    overrides: Map<FolderDropTarget, boolean>,
  ): boolean {
    const expandedOverride = overrides.get(target);
    return expandedOverride === undefined ? !normalizedFilter : !expandedOverride;
  }

  function toggleFolderCollapsed(target: FolderDropTarget) {
    setFolderExpansionOverrides((currentOverrides) => {
      const nextOverrides = new Map(currentOverrides);
      nextOverrides.set(target, getFolderCollapsedFromOverrides(target, currentOverrides));

      return nextOverrides;
    });
  }

  function startThreadRename(thread: ChatGptThread) {
    setEditingThreadId(thread.id);
    setEditingThreadTitle(thread.title);
    setEditingFolderId(null);
    setEditingFolderTitle("");
  }

  function cancelThreadRename() {
    setEditingThreadId(null);
    setEditingThreadTitle("");
  }

  function submitThreadRename(thread: ChatGptThread, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextTitle = editingThreadTitle.trim();

    if (nextTitle && nextTitle !== thread.title) {
      onRenameThread(thread.id, nextTitle);
    }

    cancelThreadRename();
  }

  function startFolderRename(folder: NotebookFolder) {
    setEditingFolderId(folder.id);
    setEditingFolderTitle(folder.title);
    setEditingThreadId(null);
    setEditingThreadTitle("");
  }

  function cancelFolderRename() {
    setEditingFolderId(null);
    setEditingFolderTitle("");
  }

  function submitFolderRename(folder: NotebookFolder, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextTitle = editingFolderTitle.trim();

    if (nextTitle && nextTitle !== folder.title) {
      onRenameFolder(folder.id, nextTitle);
    }

    cancelFolderRename();
  }

  function handleThreadDragStart(thread: ChatGptThread, event: DragEvent<HTMLElement>) {
    if (!canDragThreads) {
      event.preventDefault();
      return;
    }

    const dragStartTarget = event.target instanceof HTMLElement ? event.target : null;

    if (dragStartTarget?.closest("input, select, textarea")) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(THREAD_DRAG_DATA_TYPE, thread.id);
    event.dataTransfer.setData("text/plain", thread.id);
    setDraggingThreadId(thread.id);
    setDraggingFolderId(null);
  }

  function handleThreadDragEnd() {
    setDraggingThreadId(null);
    setDragOverFolderTarget(null);
    setDropTargetThread(null);
    setDropTargetFolder(null);
  }

  function handleFolderDragStart(folder: NotebookFolder, event: DragEvent<HTMLElement>) {
    if (!canDragFolders || editingFolderId === folder.id) {
      event.preventDefault();
      return;
    }

    const dragStartTarget = event.target instanceof HTMLElement ? event.target : null;

    if (dragStartTarget?.closest("[data-notebook-thread-row-id]")) {
      return;
    }

    if (dragStartTarget?.closest("input, select, textarea, .folder-row-actions")) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(FOLDER_DRAG_DATA_TYPE, folder.id);
    event.dataTransfer.setData("text/plain", folder.id);
    setDraggingFolderId(folder.id);
    setDraggingThreadId(null);
    setDragOverFolderTarget(null);
    setDropTargetThread(null);
  }

  function handleFolderDragEnd() {
    setDraggingFolderId(null);
    setDragOverFolderTarget(null);
    setDropTargetThread(null);
    setDropTargetFolder(null);
  }

  function handleThreadDragOver(targetThread: ChatGptThread, event: DragEvent<HTMLElement>) {
    const draggedThread = getDraggedThread(event);

    if (!draggedThread || draggedThread.id === targetThread.id) {
      return;
    }

    if (getThreadFolderId(draggedThread) !== getThreadFolderId(targetThread)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    setDragOverFolderTarget(null);
    setDropTargetThread({ threadId: targetThread.id, position: getDropPosition(event) });
  }

  function handleThreadDragLeave(targetThread: ChatGptThread, event: DragEvent<HTMLElement>) {
    const nextTarget = event.relatedTarget instanceof Node ? event.relatedTarget : null;

    if (nextTarget && event.currentTarget.contains(nextTarget)) {
      return;
    }

    setDropTargetThread((currentTarget) =>
      currentTarget?.threadId === targetThread.id ? null : currentTarget,
    );
  }

  function handleThreadDrop(targetThread: ChatGptThread, groupThreads: ChatGptThread[], event: DragEvent<HTMLElement>) {
    const draggedThread = getDraggedThread(event);

    if (!draggedThread || getThreadFolderId(draggedThread) !== getThreadFolderId(targetThread)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const targetPosition =
      dropTargetThread?.threadId === targetThread.id ? dropTargetThread.position : getDropPosition(event);
    setDraggingThreadId(null);
    setDragOverFolderTarget(null);
    setDropTargetThread(null);
    setDropTargetFolder(null);

    if (draggedThread.id === targetThread.id) {
      return;
    }

    const targetIndex = groupThreads.findIndex((thread) => thread.id === targetThread.id);
    const afterThreadId = targetPosition === "before" ? groupThreads[targetIndex - 1]?.id ?? null : targetThread.id;

    onMoveThreadAfter(draggedThread, afterThreadId);
  }

  function handleFolderDragOver(target: FolderDropTarget, event: DragEvent<HTMLElement>) {
    if (!getDraggedThread(event)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverFolderTarget(target);
    setDropTargetFolder(null);
  }

  function handleFolderDragLeave(target: FolderDropTarget, event: DragEvent<HTMLElement>) {
    const nextTarget = event.relatedTarget instanceof Node ? event.relatedTarget : null;

    if (nextTarget && event.currentTarget.contains(nextTarget)) {
      return;
    }

    setDragOverFolderTarget((currentTarget) => (currentTarget === target ? null : currentTarget));
    setDropTargetFolder((currentTarget) => (currentTarget?.folderId === target ? null : currentTarget));
  }

  function handleFolderDrop(target: FolderDropTarget, event: DragEvent<HTMLElement>) {
    event.preventDefault();

    const draggedThread = getDraggedThread(event);
    setDraggingThreadId(null);
    setDragOverFolderTarget(null);
    setDropTargetThread(null);
    setDropTargetFolder(null);

    if (!draggedThread) {
      return;
    }

    const folderId = getFolderIdFromDropTarget(target);

    if (getThreadFolderId(draggedThread) === folderId) {
      return;
    }

    onMoveThreadToFolder(draggedThread, folderId);
  }

  function handleFolderGroupDragOver(targetFolder: NotebookFolder, event: DragEvent<HTMLElement>) {
    const draggedFolder = getDraggedFolder(event);

    if (draggedFolder) {
      if (draggedFolder.id === targetFolder.id) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = "move";
      setDragOverFolderTarget(null);
      setDropTargetThread(null);
      setDropTargetFolder({ folderId: targetFolder.id, position: getDropPosition(event) });
      return;
    }

    handleFolderDragOver(targetFolder.id, event);
  }

  function handleFolderGroupDrop(targetFolder: NotebookFolder, event: DragEvent<HTMLElement>) {
    const draggedFolder = getDraggedFolder(event);

    if (draggedFolder) {
      event.preventDefault();
      event.stopPropagation();
      setDraggingFolderId(null);
      setDragOverFolderTarget(null);
      setDropTargetThread(null);
      setDropTargetFolder(null);

      if (draggedFolder.id === targetFolder.id) {
        return;
      }

      const targetPosition =
        dropTargetFolder?.folderId === targetFolder.id ? dropTargetFolder.position : getDropPosition(event);
      const targetIndex = folders.findIndex((folder) => folder.id === targetFolder.id);
      const afterFolderId = targetPosition === "before" ? folders[targetIndex - 1]?.id ?? null : targetFolder.id;

      onMoveFolderAfter(draggedFolder, afterFolderId);
      return;
    }

    handleFolderDrop(targetFolder.id, event);
  }

  function renderThreadRows(groupThreads: ChatGptThread[]) {
    return (
      <ul className="thread-list">
        {groupThreads.map((thread) => {
          const messageLabel = `${thread.messageCount} ${thread.messageCount === 1 ? "message" : "messages"}`;
          const isEditingThread = editingThreadId === thread.id;
          const isDragging = draggingThreadId === thread.id;
          const isDropBefore = dropTargetThread?.threadId === thread.id && dropTargetThread.position === "before";
          const isDropAfter = dropTargetThread?.threadId === thread.id && dropTargetThread.position === "after";

          return (
            <li
              data-notebook-thread-row-id={thread.id}
              draggable={canDragThreads && !isEditingThread}
              key={thread.id}
              onDragEnd={handleThreadDragEnd}
              onDragLeave={(event) => handleThreadDragLeave(thread, event)}
              onDragOver={(event) => handleThreadDragOver(thread, event)}
              onDragStart={(event) => handleThreadDragStart(thread, event)}
              onDrop={(event) => handleThreadDrop(thread, groupThreads, event)}
            >
              <div
                className={`thread-row${selectedThreadId === thread.id ? " is-active" : ""}${
                  canDragThreads ? " is-draggable" : ""
                }${isDragging ? " is-dragging" : ""}${isDropBefore ? " is-drop-before" : ""}${
                  isDropAfter ? " is-drop-after" : ""
                }`}
              >
                {canDragThreads ? (
                  <span className="thread-drag-handle" title="Drag notebook to a folder" aria-hidden="true">
                    <GripVertical size={15} aria-hidden="true" />
                  </span>
                ) : null}
                {isEditingThread ? (
                  <form className="thread-rename-form" onSubmit={(event) => submitThreadRename(thread, event)}>
                    <label className="sr-only" htmlFor={`thread-${thread.id}-title`}>
                      Notebook name
                    </label>
                    <input
                      id={`thread-${thread.id}-title`}
                      className="input thread-rename-input"
                      type="text"
                      value={editingThreadTitle}
                      onChange={(event) => setEditingThreadTitle(event.target.value)}
                      autoFocus
                    />
                    <button
                      className="icon-button"
                      type="submit"
                      title="Save notebook name"
                      aria-label="Save notebook name"
                      disabled={!editingThreadTitle.trim()}
                    >
                      <Check size={15} aria-hidden="true" />
                    </button>
                    <button
                      className="icon-button"
                      type="button"
                      title="Cancel edit"
                      aria-label="Cancel edit"
                      onClick={cancelThreadRename}
                    >
                      <X size={15} aria-hidden="true" />
                    </button>
                  </form>
                ) : (
                  <button className="thread-button" type="button" onClick={() => onSelectThread(thread.id)}>
                    <span className="thread-copy">
                      <span className="thread-title">{thread.title}</span>
                      <span className="thread-meta">
                        {thread.source === "notebook" ? messageLabel : `${getThreadSourceLabel(thread.source)} · ${messageLabel}`}
                      </span>
                    </span>
                    <ChevronRight className="thread-open-icon" size={16} aria-hidden="true" />
                  </button>
                )}
                <div className="thread-row-actions">
                  {isEditingThread ? null : (
                    <button
                      className="icon-button thread-edit-button"
                      type="button"
                      title="Edit notebook name"
                      aria-label={`Edit notebook name: ${thread.title}`}
                      onClick={() => startThreadRename(thread)}
                    >
                      <Pencil size={15} aria-hidden="true" />
                    </button>
                  )}
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
    );
  }

  function renderGroupedThreads() {
    return (
      <div className="folder-group-list">
        {folders.map((folder) => {
          const folderThreads = visibleThreads.filter((thread) => getThreadFolderId(thread) === folder.id);
          const dropTarget = folder.id;
          const folderContentId = `folder-${folder.id}-notebooks`;
          const folderCollapsed = isFolderCollapsed(dropTarget);
          const isEditingFolder = editingFolderId === folder.id;

          if (normalizedFilter && folderThreads.length === 0 && !draggingThreadId) {
            return null;
          }

          return (
            <section
              className={getFolderGroupClassName(dropTarget)}
              key={folder.id}
              data-notebook-folder-row-id={folder.id}
              draggable={canDragFolders && !isEditingFolder}
              aria-labelledby={`folder-${folder.id}`}
              onDragEnd={handleFolderDragEnd}
              onDragEnter={(event) => handleFolderGroupDragOver(folder, event)}
              onDragLeave={(event) => handleFolderDragLeave(dropTarget, event)}
              onDragOver={(event) => handleFolderGroupDragOver(folder, event)}
              onDragStart={(event) => handleFolderDragStart(folder, event)}
              onDrop={(event) => handleFolderGroupDrop(folder, event)}
            >
              <div className="folder-group-header">
                {isEditingFolder ? (
                  <form className="folder-rename-form" onSubmit={(event) => submitFolderRename(folder, event)}>
                    <span id={`folder-${folder.id}`} className="sr-only">
                      {folder.title}
                    </span>
                    <label className="sr-only" htmlFor={`folder-${folder.id}-title-input`}>
                      Folder name
                    </label>
                    <input
                      id={`folder-${folder.id}-title-input`}
                      className="input folder-rename-input"
                      type="text"
                      value={editingFolderTitle}
                      onChange={(event) => setEditingFolderTitle(event.target.value)}
                      autoFocus
                    />
                    <button
                      className="icon-button"
                      type="submit"
                      title="Save folder name"
                      aria-label="Save folder name"
                      disabled={!editingFolderTitle.trim()}
                    >
                      <Check size={15} aria-hidden="true" />
                    </button>
                    <button
                      className="icon-button"
                      type="button"
                      title="Cancel edit"
                      aria-label="Cancel edit"
                      onClick={cancelFolderRename}
                    >
                      <X size={15} aria-hidden="true" />
                    </button>
                  </form>
                ) : (
                  <>
                    {canDragFolders ? (
                      <span className="folder-drag-handle" title="Drag folder to reorder" aria-hidden="true">
                        <GripVertical size={15} aria-hidden="true" />
                      </span>
                    ) : null}
                    <button
                      className="folder-group-title-button"
                      type="button"
                      title={folderCollapsed ? `Expand ${folder.title}` : `Collapse ${folder.title}`}
                      aria-expanded={!folderCollapsed}
                      aria-controls={folderContentId}
                      onClick={() => toggleFolderCollapsed(dropTarget)}
                    >
                      <ChevronDown className="folder-group-collapse-icon" size={16} aria-hidden="true" />
                      <Folder size={16} aria-hidden="true" />
                      <span id={`folder-${folder.id}`} className="folder-group-title">
                        {folder.title}
                      </span>
                      <span className="folder-group-count">
                        {folderThreads.length} {folderThreads.length === 1 ? "notebook" : "notebooks"}
                      </span>
                    </button>
                  </>
                )}
                <div className="folder-row-actions">
                  {isEditingFolder ? null : (
                    <button
                      className="icon-button folder-edit-button"
                      type="button"
                      title="Edit folder name"
                      aria-label={`Edit folder name: ${folder.title}`}
                      onClick={() => startFolderRename(folder)}
                    >
                      <Pencil size={15} aria-hidden="true" />
                    </button>
                  )}
                  <button
                    className="icon-button danger folder-delete-button"
                    type="button"
                    title="Delete folder"
                    aria-label={`Delete folder ${folder.title}`}
                    onClick={() => onDeleteFolder(folder)}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div id={folderContentId} className="folder-group-content" hidden={folderCollapsed}>
                {folderThreads.length > 0 ? (
                  renderThreadRows(folderThreads)
                ) : (
                  <div className="folder-empty-state">
                    {draggingThreadId ? "Drop notebook here." : "No notebooks in this folder."}
                  </div>
                )}
              </div>
            </section>
          );
        })}
        {unfiledThreads.length > 0 || draggingThreadId ? (
          <section
            className={getFolderGroupClassName(NO_FOLDER_DROP_TARGET)}
            aria-labelledby="unfiled-notebooks-title"
            onDragEnter={(event) => handleFolderDragOver(NO_FOLDER_DROP_TARGET, event)}
            onDragLeave={(event) => handleFolderDragLeave(NO_FOLDER_DROP_TARGET, event)}
            onDragOver={(event) => handleFolderDragOver(NO_FOLDER_DROP_TARGET, event)}
            onDrop={(event) => handleFolderDrop(NO_FOLDER_DROP_TARGET, event)}
          >
            <div className="folder-group-header">
              <button
                className="folder-group-title-button"
                type="button"
                title={isFolderCollapsed(NO_FOLDER_DROP_TARGET) ? "Expand No folder" : "Collapse No folder"}
                aria-expanded={!isFolderCollapsed(NO_FOLDER_DROP_TARGET)}
                aria-controls="unfiled-notebooks-list"
                onClick={() => toggleFolderCollapsed(NO_FOLDER_DROP_TARGET)}
              >
                <ChevronDown className="folder-group-collapse-icon" size={16} aria-hidden="true" />
                <Folder size={16} aria-hidden="true" />
                <span id="unfiled-notebooks-title" className="folder-group-title">
                  No folder
                </span>
                <span className="folder-group-count">
                  {unfiledThreads.length} {unfiledThreads.length === 1 ? "notebook" : "notebooks"}
                </span>
              </button>
            </div>
            <div
              id="unfiled-notebooks-list"
              className="folder-group-content"
              hidden={isFolderCollapsed(NO_FOLDER_DROP_TARGET)}
            >
              {unfiledThreads.length > 0 ? (
                renderThreadRows(unfiledThreads)
              ) : (
                <div className="folder-empty-state">Drop notebook here.</div>
              )}
            </div>
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <nav
      className={`thread-panel${panelCollapsed ? " is-collapsed" : ""}${isFullPage ? " is-full-page" : ""}`}
      aria-labelledby="notebook-list-title"
    >
      <div className="thread-panel-header">
        {canCollapse ? (
          <button
            className="thread-panel-title-button"
            type="button"
            title={panelCollapsed ? "Show notebooks" : "Hide notebooks"}
            aria-expanded={!panelCollapsed}
            aria-controls="notebook-list-body"
            onClick={() => setCollapsed((isCollapsed) => !isCollapsed)}
          >
            <ChevronDown className="thread-panel-collapse-icon" size={16} aria-hidden="true" />
            <span id="notebook-list-title" className="thread-panel-title">
              Notebooks
            </span>
          </button>
        ) : (
          <button
            className={`thread-panel-title-button is-notebook-toggle${notebookBarExpanded ? " is-expanded" : ""}`}
            type="button"
            title={notebookBarExpanded ? "Hide notebook tools" : "Show notebook tools"}
            aria-label={notebookBarExpanded ? "Hide notebook tools" : "Show notebook tools"}
            aria-expanded={notebookBarExpanded}
            aria-controls="notebook-list-tools"
            onClick={toggleNotebookBarExpanded}
          >
            <span id="notebook-list-title" className="thread-panel-title">
              Notebooks
            </span>
          </button>
        )}
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
            className={`icon-button notebook-create-button${notebookCreateActive ? " is-active" : ""}`}
            type="button"
            title="Create notebook"
            aria-label="Create notebook"
            aria-expanded={notebookCreateExpanded}
            onClick={openNotebookCreate}
          >
            <Plus size={17} aria-hidden="true" />
          </button>
          {isFullPage ? (
            <>
              <button
                className={`icon-button folder-create-button${folderCreateActive ? " is-active" : ""}`}
                type="button"
                title="Create folder"
                aria-label="Create folder"
                aria-expanded={folderCreateExpanded}
                onClick={openFolderCreate}
              >
                <FolderPlus size={17} aria-hidden="true" />
              </button>
            </>
          ) : null}
          {cloudAccountControl}
          {themeToggle}
        </div>
      </div>
      {isFullPage || toolsOpen ? (
        <div id="notebook-list-tools" className="thread-panel-tools" hidden={!toolsOpen}>
          {searchOpen ? (
            <SearchBox
              label="Search notebooks"
              placeholder="Search notebooks"
              value={filter}
              onChange={onFilterChange}
            />
          ) : null}
          {notebookBarExpanded || createOpen || folderCreateOpen ? (
            <div className="notebook-tools-primary-row">
              {notebookBarExpanded || createOpen ? (
                <form className="notebook-create-form" onSubmit={onCreateNotebook}>
                  <label className="notebook-title-field">
                    <span className="sr-only">Notebook name</span>
                    <input
                      ref={notebookTitleInputRef}
                      className="input"
                      type="text"
                      value={newNotebookTitle}
                      placeholder="New notebook"
                      onChange={(event) => onNewNotebookTitleChange(event.target.value)}
                      onFocus={() => setFocusedCreateInput("notebook")}
                      onBlur={() => setFocusedCreateInput(null)}
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
              {notebookBarExpanded || folderCreateOpen ? (
                <form className="notebook-create-form" onSubmit={onCreateFolder}>
                  <label className="notebook-title-field">
                    <span className="sr-only">Folder name</span>
                    <input
                      ref={folderTitleInputRef}
                      className="input"
                      type="text"
                      value={newFolderTitle}
                      placeholder="New folder"
                      onChange={(event) => onNewFolderTitleChange(event.target.value)}
                      onFocus={() => setFocusedCreateInput("folder")}
                      onBlur={() => setFocusedCreateInput(null)}
                    />
                  </label>
                  <button
                    className="icon-button folder-create-button"
                    type="submit"
                    title="Create folder"
                    aria-label="Create folder"
                    disabled={!newFolderTitle.trim()}
                  >
                    <FolderPlus size={18} aria-hidden="true" />
                  </button>
                </form>
              ) : null}
              {backupToolsOpen && cloudBackupControl ? (
                <div className="notebook-cloud-action-row" aria-label="Cloud backup tools">
                  {cloudBackupControl}
                </div>
              ) : null}
              {backupToolsOpen ? (
                <div className="notebook-tools-action-row" aria-label="Local backup tools">
                  {autosaveControl}
                  <button
                    className="icon-button backup-export-button"
                    type="button"
                    title="Export all data"
                    aria-label="Export all data"
                    onClick={onExportBackup}
                  >
                    <FileDown size={17} aria-hidden="true" />
                    <span>Export all data</span>
                  </button>
                  <button
                    className="icon-button backup-import-button"
                    type="button"
                    title="Import all data"
                    aria-label="Import all data"
                    onClick={() => backupImportInputRef.current?.click()}
                  >
                    <FileUp size={17} aria-hidden="true" />
                    <span>Import all data</span>
                  </button>
                  <input
                    ref={backupImportInputRef}
                    className="sr-only"
                    type="file"
                    accept="application/json,.json"
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      event.currentTarget.value = "";

                      if (file) {
                        onImportBackup(file);
                      }
                    }}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      <div id="notebook-list-body" className="thread-panel-body" hidden={panelCollapsed}>
        {visibleThreads.length === 0 && (normalizedFilter || folders.length === 0) ? (
          <div className="empty-state">{emptyMessage}</div>
        ) : shouldGroupThreads ? (
          renderGroupedThreads()
        ) : (
          renderThreadRows(visibleThreads)
        )}
      </div>
    </nav>
  );
}

function getThreadSourceLabel(source: ChatGptThread["source"]): string {
  return source === "deepwiki" ? "DeepWiki" : "ChatGPT";
}
