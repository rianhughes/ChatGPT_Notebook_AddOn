import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeft,
  ChevronDown,
  ListCollapse,
  Moon,
  Sun,
  Sunset,
  UnfoldVertical,
} from "lucide-react";

import "../styles/sidebar.css";
import type {
  ActiveChatGptContextResponse,
  ActiveSaveTargetResponse,
  InsertTextInChatGptResponse,
  OpenSidebarWindowResponse,
} from "../core/ports";
import { copyText, getMessageCopyText } from "../core/clipboard";
import { contentHashFromParts, createId } from "../core/hash";
import type { ChatGptThread, NotebookFolder, SavedMessage } from "../core/models";
import { deleteHeadingSectionFromMarkdown, extractHeadingSectionFromMarkdown } from "../core/markdown";
import {
  createNotebookExportData,
  createNotebookExportFile,
  NOTEBOOK_EXPORT_FORMATTERS,
  type NotebookExportFormatId,
} from "../core/notebookExport";
import { createNotebookPrintHtml } from "../core/notebookPrint";
import {
  appendMessage,
  createNotebook,
  createFolder,
  deleteFolder,
  deleteMessage,
  deleteSelectedTextFromMessage,
  deleteThread,
  getFolders,
  getMessagesInOrder,
  getThreadBySource,
  getThreads,
  mergeMessages,
  moveMessageAfterMessage,
  moveThreadToFolder,
  renameFolder,
  renameThreadTitle,
  restoreDeletedMessage,
  restoreNotebookSnapshot,
  updateMessageContent,
  type NotebookSnapshot,
} from "../core/repository";
import { filterMessagesBySearch } from "../core/search";
import { sendRuntimeMessage } from "../browser/runtime";
import { MessageList } from "./components/MessageList";
import { getHighlightedInsertText, getHighlightedText, selectionBelongsToElement } from "./insertSelection";
import { syncDefaultCollapsedMessageIds } from "./noteCollapseDefaults";
import type { ThemeMode } from "./theme";
import { applyTheme, getInitialTheme, getNextTheme, persistTheme } from "./theme";
import { ThreadList } from "./components/ThreadList";
import { Toolbar } from "./components/Toolbar";
import { downloadNotebookExport } from "./downloadExport";
import { openNotebookPrintWindow } from "./printExport";

const initialTheme = getInitialTheme();
applyTheme(initialTheme);
const MAX_UNDO_STEPS_PER_MESSAGE = 20;
const MAX_NOTEBOOK_UNDO_STEPS = 20;
const NEW_NOTE_TITLE = "New note";

const themeLabels: Record<ThemeMode, string> = {
  day: "Day",
  evening: "Evening",
  night: "Night",
};

function getThemeIcon(theme: ThemeMode) {
  if (theme === "day") {
    return <Sun size={17} aria-hidden="true" />;
  }

  if (theme === "evening") {
    return <Sunset size={17} aria-hidden="true" />;
  }

  return <Moon size={17} aria-hidden="true" />;
}

function App() {
  const [theme, setTheme] = useState(initialTheme);
  const [threads, setThreads] = useState<ChatGptThread[]>([]);
  const [folders, setFolders] = useState<NotebookFolder[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [threadFilter, setThreadFilter] = useState("");
  const [messageQuery, setMessageQuery] = useState("");
  const [newNotebookTitle, setNewNotebookTitle] = useState("");
  const [newFolderTitle, setNewFolderTitle] = useState("");
  const [messageUndoHistory, setMessageUndoHistory] = useState<Record<string, string[]>>({});
  const [notebookUndoHistory, setNotebookUndoHistory] = useState<Record<string, NotebookSnapshot[]>>({});
  const [lastDeletedMessage, setLastDeletedMessage] = useState<SavedMessage | null>(null);
  const [isMergingMessages, setIsMergingMessages] = useState(false);
  const [selectedMergeMessageIds, setSelectedMergeMessageIds] = useState<Set<string>>(() => new Set());
  const [collapsedMessageIds, setCollapsedMessageIds] = useState<Set<string>>(() => new Set());
  const defaultCollapsedThreadIdRef = useRef<string | null>(null);
  const knownDefaultCollapsedMessageIdsRef = useRef<Set<string>>(new Set());
  const [isNotebookToolsOpen, setIsNotebookToolsOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const selectedThread = threads.find((thread) => thread.id === selectedThreadId) ?? null;
  const isNotebookDetailVisible = isNotebookOpen && Boolean(selectedThread);
  const visibleMessages = useMemo(
    () => filterMessagesBySearch(messages, messageQuery),
    [messages, messageQuery],
  );
  const areAllVisibleMessagesCollapsed =
    visibleMessages.length > 0 && visibleMessages.every((message) => collapsedMessageIds.has(message.id));
  const selectedMergeMessages = useMemo(
    () => messages.filter((message) => selectedMergeMessageIds.has(message.id)),
    [messages, selectedMergeMessageIds],
  );
  const undoableMessageIds = useMemo(
    () => new Set(Object.entries(messageUndoHistory).filter(([, history]) => history.length > 0).map(([id]) => id)),
    [messageUndoHistory],
  );
  const canUndoNotebook = Boolean(selectedThreadId && notebookUndoHistory[selectedThreadId]?.length);
  const canUndoDeletedMessage = Boolean(lastDeletedMessage && lastDeletedMessage.threadId === selectedThreadId);

  useEffect(() => {
    applyTheme(theme);
    persistTheme(theme);
  }, [theme]);

  const loadThreads = useCallback(async () => {
    const nextThreads = await getThreads();
    setThreads(nextThreads);
    return nextThreads;
  }, []);

  const loadFolders = useCallback(async () => {
    const nextFolders = await getFolders();
    setFolders(nextFolders);
    return nextFolders;
  }, []);

  const loadMessages = useCallback(async (threadId: string | null) => {
    if (!threadId) {
      setMessages([]);
      return;
    }

    setMessages(await getMessagesInOrder(threadId));
  }, []);

  useEffect(() => {
    void (async () => {
      await Promise.all([loadThreads(), loadFolders()]);

      try {
        const activeSaveTarget = await sendRuntimeMessage<ActiveSaveTargetResponse>({
          type: "GET_ACTIVE_SAVE_TARGET",
          payload: {},
        });

        if (activeSaveTarget) {
          setSelectedThreadId(activeSaveTarget.id);
          return;
        }
      } catch {
        // Older background startup timing should not block the sidebar.
      }

      try {
        const activeContext = await sendRuntimeMessage<ActiveChatGptContextResponse>({
          type: "GET_ACTIVE_CHATGPT_CONTEXT",
          payload: {},
        });

        if (activeContext) {
          const activeThread = await getThreadBySource(activeContext.sourceThreadId);

          if (activeThread) {
            setSelectedThreadId(activeThread.id);
            return;
          }
        }
      } catch {
        // The sidebar still works as a standalone IndexedDB reader.
      }

      setSelectedThreadId(null);
    })();
  }, [loadFolders, loadThreads]);

  useEffect(() => {
    setSelectedMergeMessageIds((current) => {
      if (current.size === 0) {
        return current;
      }

      const messageIds = new Set(messages.map((message) => message.id));
      const next = new Set([...current].filter((messageId) => messageIds.has(messageId)));
      return next.size === current.size ? current : next;
    });
  }, [messages]);

  useEffect(() => {
    if (!isNotebookDetailVisible) {
      setMessages([]);
      setIsNotebookToolsOpen(false);
      setIsMergingMessages(false);
      setSelectedMergeMessageIds(new Set());
      return;
    }

    void loadMessages(selectedThreadId);
    setIsNotebookToolsOpen(false);
  }, [isNotebookDetailVisible, loadMessages, selectedThreadId]);

  useEffect(() => {
    if (!isNotebookDetailVisible || !selectedThreadId) {
      defaultCollapsedThreadIdRef.current = null;
      knownDefaultCollapsedMessageIdsRef.current = new Set();
      return;
    }

    let knownMessageIds = knownDefaultCollapsedMessageIdsRef.current;

    if (defaultCollapsedThreadIdRef.current !== selectedThreadId) {
      defaultCollapsedThreadIdRef.current = selectedThreadId;
      knownMessageIds = new Set();
    }

    setCollapsedMessageIds((current) => {
      const synced = syncDefaultCollapsedMessageIds(messages, current, knownMessageIds);
      return synced.changed ? synced.collapsedMessageIds : current;
    });
    knownDefaultCollapsedMessageIdsRef.current = new Set(messages.map((message) => message.id));
  }, [isNotebookDetailVisible, messages, selectedThreadId]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadThreads();
      void loadFolders();

      if (isNotebookDetailVisible) {
        void loadMessages(selectedThreadId);
      }
    }, 1500);

    return () => window.clearInterval(intervalId);
  }, [isNotebookDetailVisible, loadFolders, loadMessages, loadThreads, selectedThreadId]);

  function resetCollapsedMessages() {
    defaultCollapsedThreadIdRef.current = null;
    knownDefaultCollapsedMessageIdsRef.current = new Set();
    setCollapsedMessageIds(new Set());
  }

  async function selectThread(threadId: string) {
    setSelectedThreadId(threadId);
    setIsNotebookOpen(true);
    setMessageQuery("");
    resetCollapsedMessages();
    setMessageUndoHistory({});
    setLastDeletedMessage(null);
    setIsMergingMessages(false);
    setSelectedMergeMessageIds(new Set());
    setIsNotebookToolsOpen(false);
    setStatus("");
    setError("");

    try {
      await sendRuntimeMessage<ActiveSaveTargetResponse>({
        type: "SET_ACTIVE_SAVE_TARGET",
        payload: { threadId },
      });
    } catch {
      setError("Could not update save target.");
    }
  }

  function showNotebookList() {
    setIsNotebookOpen(false);
    setMessageQuery("");
    resetCollapsedMessages();
    setMessageUndoHistory({});
    setLastDeletedMessage(null);
    setIsMergingMessages(false);
    setSelectedMergeMessageIds(new Set());
    setIsNotebookToolsOpen(false);
    setStatus("");
    setError("");
  }

  async function addNotebook(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newNotebookTitle.trim();

    if (!title) {
      return;
    }

    setError("");
    const notebook = await createNotebook({ title });
    setNewNotebookTitle("");
    await loadThreads();
    await selectThread(notebook.id);
    setStatus("Notebook created");
  }

  async function addFolder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newFolderTitle.trim();

    if (!title) {
      return;
    }

    setError("");

    try {
      const folder = await createFolder({ title });
      setNewFolderTitle("");
      await loadFolders();
      setStatus(`Folder created: ${folder.title}`);
    } catch {
      setError("Could not create folder.");
    }
  }

  async function removeThread(thread: ChatGptThread) {
    setError("");
    setStatus("");

    const confirmed = window.confirm(
      `Delete "${thread.title}" and ${thread.messageCount} ${thread.messageCount === 1 ? "note" : "notes"}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteThread(thread.id);
      await loadThreads();
      resetCollapsedMessages();
      setMessageUndoHistory({});
      setLastDeletedMessage(null);
      setIsMergingMessages(false);
      setSelectedMergeMessageIds(new Set());
      removeNotebookUndoHistory(thread.id);

      if (selectedThreadId === thread.id) {
        setSelectedThreadId(null);
        setIsNotebookOpen(false);
        await loadMessages(null);
      } else if (isNotebookDetailVisible) {
        await loadMessages(selectedThreadId);
      }

      setStatus("Deleted notebook");
    } catch {
      setError("Could not delete notebook.");
    }
  }

  async function moveThreadFolder(thread: ChatGptThread, folderId: string | null) {
    setError("");
    setStatus("");

    try {
      const updatedThread = await moveThreadToFolder(thread.id, folderId);
      await loadThreads();
      const folder = folderId ? folders.find((item) => item.id === folderId) : null;
      setStatus(
        folder ? `Moved ${updatedThread.title} to ${folder.title}` : `Moved ${updatedThread.title} to no folder`,
      );
    } catch {
      setError("Could not move notebook.");
    }
  }

  async function updateFolderTitle(folderId: string, title: string) {
    setError("");
    setStatus("");

    try {
      const updated = await renameFolder(folderId, title);
      await loadFolders();
      setStatus(`Renamed folder to ${updated.title}`);
    } catch {
      setError("Could not rename folder.");
    }
  }

  async function removeFolder(folder: NotebookFolder) {
    setError("");
    setStatus("");

    const confirmed = window.confirm(`Delete folder "${folder.title}"? Notebooks inside it will stay saved.`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteFolder(folder.id);
      await Promise.all([loadFolders(), loadThreads()]);
      setStatus("Deleted folder");
    } catch {
      setError("Could not delete folder.");
    }
  }

  async function exportSelectedNotebook(formatId: NotebookExportFormatId) {
    setError("");
    setStatus("");

    if (!selectedThread) {
      setError("Select a notebook first.");
      return;
    }

    try {
      const orderedMessages = await getMessagesInOrder(selectedThread.id);
      const exportData = createNotebookExportData(selectedThread, orderedMessages);
      const file = createNotebookExportFile(exportData, formatId);

      downloadNotebookExport(file);
      setStatus(`Exported ${selectedThread.title} as ${file.format.label}`);
    } catch {
      setError("Could not export notebook.");
    }
  }

  async function printSelectedNotebookAsPdf() {
    setError("");
    setStatus("");

    if (!selectedThread) {
      setError("Select a notebook first.");
      return;
    }

    const printWindow = openNotebookPrintWindow();

    if (!printWindow) {
      setError("Could not open print window.");
      return;
    }

    try {
      const orderedMessages = await getMessagesInOrder(selectedThread.id);
      const exportData = createNotebookExportData(selectedThread, orderedMessages);

      printWindow.print(createNotebookPrintHtml(exportData));
      setStatus(`Opened PDF export for ${selectedThread.title}`);
    } catch {
      printWindow.close();
      setError("Could not export notebook.");
    }
  }

  async function updateSelectedThreadTitle(threadId: string, title: string) {
    setError("");
    setStatus("");
    const undoSnapshot = isNotebookDetailVisible && threadId === selectedThreadId ? createNotebookUndoSnapshot(threadId) : null;

    try {
      const updated = await renameThreadTitle(threadId, title);
      pushNotebookUndoSnapshot(undoSnapshot);
      await loadThreads();
      setStatus(`Renamed to ${updated.title}`);
    } catch {
      setError("Could not rename notebook.");
    }
  }

  function createNotebookUndoSnapshot(threadId: string | null = selectedThreadId): NotebookSnapshot | null {
    if (!threadId) {
      return null;
    }

    const thread = threads.find((candidate) => candidate.id === threadId);

    if (!thread) {
      return null;
    }

    return {
      thread: { ...thread },
      messages: messages.filter((message) => message.threadId === thread.id).map((message) => ({ ...message })),
    };
  }

  function pushNotebookUndoSnapshot(snapshot: NotebookSnapshot | null) {
    if (!snapshot) {
      return;
    }

    setNotebookUndoHistory((current) => ({
      ...current,
      [snapshot.thread.id]: [snapshot, ...(current[snapshot.thread.id] ?? [])].slice(0, MAX_NOTEBOOK_UNDO_STEPS),
    }));
  }

  function popNotebookUndoSnapshot(threadId: string) {
    setNotebookUndoHistory((current) => {
      const [, ...remainingHistory] = current[threadId] ?? [];
      return {
        ...current,
        [threadId]: remainingHistory,
      };
    });
  }

  function removeNotebookUndoHistory(threadId: string) {
    setNotebookUndoHistory((current) => {
      if (!current[threadId]) {
        return current;
      }

      const remainingHistory = { ...current };
      delete remainingHistory[threadId];
      return remainingHistory;
    });
  }

  async function undoNotebookChange() {
    setError("");
    setStatus("");

    if (!selectedThreadId) {
      setError("Select a notebook first.");
      return;
    }

    const snapshot = notebookUndoHistory[selectedThreadId]?.[0];

    if (!snapshot) {
      setError("Nothing to undo in this notebook.");
      return;
    }

    try {
      await restoreNotebookSnapshot(snapshot);
      popNotebookUndoSnapshot(selectedThreadId);
      setMessageUndoHistory({});
      setLastDeletedMessage(null);
      setIsMergingMessages(false);
      setSelectedMergeMessageIds(new Set());
      resetCollapsedMessages();
      setStatus("Undid notebook change");
      await loadMessages(selectedThreadId);
      await loadThreads();
    } catch {
      setError("Could not undo notebook change.");
    }
  }

  async function createNoteInSelectedNotebook() {
    setError("");
    setStatus("");

    if (!selectedThread) {
      setError("Select a notebook first.");
      return;
    }

    const contentMarkdown = "";
    const contentText = "";
    const undoSnapshot = createNotebookUndoSnapshot(selectedThread.id);

    try {
      const createdMessage = await appendMessage(selectedThread.id, {
        sourceMessageId: null,
        sourceMessageKey: createId("manual-note"),
        contentHash: contentHashFromParts({ contentMarkdown, contentText }),
        role: "note",
        title: NEW_NOTE_TITLE,
        contentMarkdown,
        contentText,
      });

      pushNotebookUndoSnapshot(undoSnapshot);
      setMessageQuery("");
      setCollapsedMessageIds((current) => new Set(current).add(createdMessage.id));
      setStatus("Created note");
      await loadMessages(selectedThread.id);
      await loadThreads();
    } catch {
      setError("Could not create note.");
    }
  }

  function startMergeSelection() {
    setError("");
    setStatus("");

    if (messages.length < 2) {
      setError("At least two notes are needed to merge.");
      return;
    }

    setIsMergingMessages(true);
    setSelectedMergeMessageIds(new Set());
  }

  function cancelMergeSelection() {
    setError("");
    setStatus("");
    setIsMergingMessages(false);
    setSelectedMergeMessageIds(new Set());
  }

  function toggleMergeMessageSelection(messageId: string) {
    setSelectedMergeMessageIds((current) => {
      const next = new Set(current);

      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }

      return next;
    });
  }

  async function mergeSelectedMessages() {
    setError("");
    setStatus("");

    if (!selectedThreadId || selectedMergeMessages.length < 2) {
      setError("Select at least two notes to merge.");
      return;
    }

    const mergedCount = selectedMergeMessages.length;
    const undoSnapshot = createNotebookUndoSnapshot(selectedThreadId);

    try {
      const mergedMessage = await mergeMessages(
        selectedThreadId,
        selectedMergeMessages.map((message) => message.id),
      );

      if (!mergedMessage) {
        setError("Select at least two notes to merge.");
        return;
      }

      setIsMergingMessages(false);
      setSelectedMergeMessageIds(new Set());
      pushNotebookUndoSnapshot(undoSnapshot);
      setStatus(`Merged ${mergedCount} notes`);
      await loadMessages(selectedThreadId);
      await loadThreads();
    } catch {
      setError("Could not merge selected notes.");
    }
  }

  async function moveMessageAfter(message: SavedMessage, afterMessageId: string | null) {
    setError("");
    setStatus("");
    const undoSnapshot = createNotebookUndoSnapshot(message.threadId);

    try {
      setMessages(await moveMessageAfterMessage(message.threadId, message.id, afterMessageId));
      pushNotebookUndoSnapshot(undoSnapshot);
      setStatus("Moved note");
      await loadThreads();
    } catch {
      setError("Could not reorder notes.");
    }
  }

  async function copyMessage(message: SavedMessage) {
    const highlightedText = getHighlightedText(window.getSelection(), getMessageElement(message.id));
    await runClipboardAction(
      highlightedText ?? getMessageCopyText(message),
      highlightedText ? "Copied highlighted text" : "Copied message",
    );
  }

  async function insertMessageIntoChatGpt(message: SavedMessage) {
    const highlightedText = getHighlightedInsertText(window.getSelection(), getMessageElement(message.id));
    const text = highlightedText ?? getMessageCopyText(message);

    await runChatGptInsertAction(
      text,
      highlightedText ? "Inserted highlighted text into ChatGPT" : "Inserted note into ChatGPT",
    );
  }

  async function insertMessageSectionIntoChatGpt(message: SavedMessage, headingIndex: number) {
    setError("");
    setStatus("");

    const sectionMarkdown = extractHeadingSectionFromMarkdown(getStoredMessageMarkdown(message), headingIndex);

    if (!sectionMarkdown) {
      setError("Could not find that section.");
      return;
    }

    await runChatGptInsertAction(sectionMarkdown, "Inserted section into ChatGPT");
  }

  async function saveMessageEdit(message: SavedMessage, title: string, contentMarkdown: string) {
    setError("");
    setStatus("");
    const previousMarkdown = getStoredMessageMarkdown(message);
    const nextMarkdown = contentMarkdown.replace(/\r\n/g, "\n").trim();
    const previousTitle = normalizeNotebookTitle(message.title);
    const nextTitle = normalizeNotebookTitle(title);
    const undoSnapshot = createNotebookUndoSnapshot(message.threadId);

    try {
      await updateMessageContent(message.threadId, message.id, nextMarkdown, title);
      if (previousMarkdown !== nextMarkdown) {
        pushMessageUndoSnapshot(message.id, previousMarkdown);
      }

      if (previousMarkdown !== nextMarkdown || previousTitle !== nextTitle) {
        pushNotebookUndoSnapshot(undoSnapshot);
      }
      setStatus("Updated note");
      await loadMessages(message.threadId);
      await loadThreads();
    } catch {
      setError("Could not update note.");
    }
  }

  async function removeSelectedText(message: SavedMessage) {
    setError("");
    setStatus("");

    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() ?? "";
    const messageElement = getMessageElement(message.id);

    if (!selection || selection.isCollapsed || !selectedText) {
      setError("Highlight text inside this note first.");
      return;
    }

    if (!messageElement || !selectionBelongsToElement(selection, messageElement)) {
      setError("Highlighted text must be inside this note.");
      return;
    }

    const undoSnapshot = createNotebookUndoSnapshot(message.threadId);
    const updatedMessage = await deleteSelectedTextFromMessage(message.threadId, message.id, selectedText);

    if (!updatedMessage) {
      setError("That highlight could not be matched in the stored note.");
      return;
    }

    pushMessageUndoSnapshot(message.id, getStoredMessageMarkdown(message));
    pushNotebookUndoSnapshot(undoSnapshot);
    selection.removeAllRanges();
    setStatus("Deleted highlighted text");
    await loadMessages(message.threadId);
    await loadThreads();
  }

  async function deleteSingleMessage(message: SavedMessage) {
    setError("");
    setStatus("");
    const undoSnapshot = createNotebookUndoSnapshot(message.threadId);

    try {
      await deleteMessage(message.threadId, message.id);
      setLastDeletedMessage(message);
      removeMessageUndoHistory(message.id);
      pushNotebookUndoSnapshot(undoSnapshot);
      setSelectedMergeMessageIds((current) => {
        if (!current.has(message.id)) {
          return current;
        }

        const next = new Set(current);
        next.delete(message.id);
        return next;
      });
      setCollapsedMessageIds((current) => {
        if (!current.has(message.id)) {
          return current;
        }

        const next = new Set(current);
        next.delete(message.id);
        return next;
      });
      setStatus("Deleted note");
      await loadMessages(selectedThreadId);
      await loadThreads();
    } catch {
      setError("Could not delete note.");
    }
  }

  async function deleteMessageSection(message: SavedMessage, headingIndex: number) {
    setError("");
    setStatus("");

    const previousMarkdown = getStoredMessageMarkdown(message);
    const nextMarkdown = deleteHeadingSectionFromMarkdown(previousMarkdown, headingIndex);

    if (nextMarkdown === null) {
      setError("Could not find that section.");
      return;
    }

    const undoSnapshot = createNotebookUndoSnapshot(message.threadId);

    try {
      await updateMessageContent(message.threadId, message.id, nextMarkdown);
      pushMessageUndoSnapshot(message.id, previousMarkdown);
      pushNotebookUndoSnapshot(undoSnapshot);
      setStatus("Deleted section");
      await loadMessages(message.threadId);
      await loadThreads();
    } catch {
      setError("Could not delete section.");
    }
  }

  async function undoMessageEdit(message: SavedMessage) {
    setError("");
    setStatus("");

    const previousMarkdown = messageUndoHistory[message.id]?.[0];

    if (!previousMarkdown) {
      setError("Nothing to undo for this note.");
      return;
    }

    const undoSnapshot = createNotebookUndoSnapshot(message.threadId);

    try {
      await updateMessageContent(message.threadId, message.id, previousMarkdown);
      popMessageUndoSnapshot(message.id);
      pushNotebookUndoSnapshot(undoSnapshot);
      setStatus("Undid last note edit");
      await loadMessages(message.threadId);
      await loadThreads();
    } catch {
      setError("Could not undo note edit.");
    }
  }

  async function undoLastDeletedMessage() {
    setError("");
    setStatus("");

    if (!lastDeletedMessage || lastDeletedMessage.threadId !== selectedThreadId) {
      setError("Nothing to restore.");
      return;
    }

    const undoSnapshot = createNotebookUndoSnapshot(lastDeletedMessage.threadId);

    try {
      const restoredMessage = await restoreDeletedMessage(lastDeletedMessage);
      setLastDeletedMessage(null);
      pushNotebookUndoSnapshot(undoSnapshot);
      setCollapsedMessageIds((current) => new Set(current).add(restoredMessage.id));
      setStatus("Restored note");
      await loadMessages(restoredMessage.threadId);
      await loadThreads();
    } catch {
      setError("Could not restore deleted note.");
    }
  }

  function pushMessageUndoSnapshot(messageId: string, contentMarkdown: string) {
    setMessageUndoHistory((current) => ({
      ...current,
      [messageId]: [contentMarkdown, ...(current[messageId] ?? [])].slice(0, MAX_UNDO_STEPS_PER_MESSAGE),
    }));
  }

  function popMessageUndoSnapshot(messageId: string) {
    setMessageUndoHistory((current) => {
      const [, ...remainingHistory] = current[messageId] ?? [];
      return {
        ...current,
        [messageId]: remainingHistory,
      };
    });
  }

  function removeMessageUndoHistory(messageId: string) {
    setMessageUndoHistory((current) => {
      if (!current[messageId]) {
        return current;
      }

      const remainingHistory = { ...current };
      delete remainingHistory[messageId];
      return remainingHistory;
    });
  }

  function toggleAllVisibleMessagesCollapsed() {
    setCollapsedMessageIds((current) => {
      const next = new Set(current);

      visibleMessages.forEach((message) => {
        if (areAllVisibleMessagesCollapsed) {
          next.delete(message.id);
        } else {
          next.add(message.id);
        }
      });

      return next;
    });
  }

  async function runClipboardAction(text: string, successMessage: string) {
    setError("");

    if (!text.trim()) {
      setStatus("");
      setError("Nothing to copy.");
      return;
    }

    try {
      await copyText(text);
      setStatus(successMessage);
    } catch {
      setStatus("");
      setError("Clipboard access failed.");
    }
  }

  async function runChatGptInsertAction(text: string, successMessage: string) {
    setError("");
    setStatus("");

    if (!text.trim()) {
      setError("Nothing to insert.");
      return;
    }

    try {
      const response = await sendRuntimeMessage<InsertTextInChatGptResponse>({
        type: "INSERT_TEXT_IN_CHATGPT",
        payload: { text },
      });

      if (!response.inserted) {
        setError(response.error ?? "Could not insert into ChatGPT.");
        return;
      }

      setStatus(successMessage);
    } catch {
      setError("Could not insert into ChatGPT.");
    }
  }

  async function openStandaloneWindow() {
    setError("");
    setStatus("");

    try {
      const response = await sendRuntimeMessage<OpenSidebarWindowResponse>({
        type: "OPEN_SIDEBAR_WINDOW",
        payload: {},
      });

      if (!response.opened) {
        setError(response.error ?? "Could not open notes window.");
        return;
      }

      setStatus("Opened notes window");
    } catch {
      setError("Could not open notes window.");
    }
  }

  const themeToggle = (
    <button
      className="icon-button theme-toggle-button"
      type="button"
      title={`Current theme: ${themeLabels[theme]}. Switch to ${themeLabels[getNextTheme(theme)]} mode`}
      aria-label={`Current theme: ${themeLabels[theme]}. Switch to ${themeLabels[getNextTheme(theme)]} mode`}
      onClick={() => setTheme((currentTheme) => getNextTheme(currentTheme))}
    >
      {getThemeIcon(theme)}
    </button>
  );

  const feedback = status || error ? (
    <div className="app-feedback" aria-live="polite">
      {status ? <span className="copy-status">{status}</span> : null}
      {error ? <span className="error-text">{error}</span> : null}
    </div>
  ) : null;
  const noteCollapseToggleLabel = areAllVisibleMessagesCollapsed ? "Expand notes" : "Collapse notes";

  return (
    <main className={`app-shell${isNotebookDetailVisible ? " is-notebook-detail" : " is-notebook-list"}`}>
      {isNotebookDetailVisible ? (
        <>
          <header className="notebook-detail-header">
            <button className="tool-button secondary notebook-back-button" type="button" onClick={showNotebookList}>
              <ArrowLeft size={16} aria-hidden="true" />
              All notebooks
            </button>
            <h1 className="notebook-detail-title">{selectedThread?.title ?? "Notebook"}</h1>
            <div className="notebook-detail-actions">
              <button
                className="icon-button notebook-detail-notes-toggle"
                type="button"
                title={noteCollapseToggleLabel}
                aria-label={noteCollapseToggleLabel}
                disabled={visibleMessages.length === 0}
                onClick={toggleAllVisibleMessagesCollapsed}
              >
                {areAllVisibleMessagesCollapsed ? (
                  <UnfoldVertical size={18} aria-hidden="true" />
                ) : (
                  <ListCollapse size={18} aria-hidden="true" />
                )}
              </button>
              <button
                className={`icon-button notebook-detail-tools-toggle${isNotebookToolsOpen ? " is-active" : ""}`}
                type="button"
                title={isNotebookToolsOpen ? "Hide notebook tools" : "Show notebook tools"}
                aria-label={isNotebookToolsOpen ? "Hide notebook tools" : "Show notebook tools"}
                aria-expanded={isNotebookToolsOpen}
                aria-controls="message-tools-panel"
                onClick={() => setIsNotebookToolsOpen((isOpen) => !isOpen)}
              >
                <ChevronDown className="notebook-detail-tools-icon" size={18} aria-hidden="true" />
              </button>
            </div>
          </header>

          <Toolbar
            selectedThread={selectedThread}
            searchQuery={messageQuery}
            canMergeMessages={messages.length > 1}
            mergeMode={isMergingMessages}
            selectedMergeCount={selectedMergeMessages.length}
            canUndoNotebook={canUndoNotebook}
            toolsOpen={isNotebookToolsOpen}
            exportFormats={NOTEBOOK_EXPORT_FORMATTERS}
            onSearchChange={setMessageQuery}
            onToolsOpenChange={setIsNotebookToolsOpen}
            onRenameThread={updateSelectedThreadTitle}
            onRequestExport={(formatId) => void exportSelectedNotebook(formatId)}
            onRequestPrintExport={() => void printSelectedNotebookAsPdf()}
            onCreateNote={() => void createNoteInSelectedNotebook()}
            onUndoNotebook={() => void undoNotebookChange()}
            onOpenStandaloneWindow={() => void openStandaloneWindow()}
            onStartMergeSelection={startMergeSelection}
            onConfirmMergeSelection={() => void mergeSelectedMessages()}
            onCancelMergeSelection={cancelMergeSelection}
          />

          <section className="message-panel" aria-label="Saved messages">
            <div className="message-feedback" aria-live="polite">
              {status ? <span className="copy-status">{status}</span> : null}
              {error ? <span className="error-text">{error}</span> : null}
            </div>
            <MessageList
              messages={visibleMessages}
              undoableMessageIds={undoableMessageIds}
              canUndoDeletedMessage={canUndoDeletedMessage}
              selectedMessageIds={selectedMergeMessageIds}
              isSelectingForMerge={isMergingMessages}
              collapsedMessageIds={collapsedMessageIds}
              canReorderMessages={messages.length > 1 && !messageQuery.trim() && !isMergingMessages}
              onCollapsedMessageIdsChange={setCollapsedMessageIds}
              onToggleMessageSelection={toggleMergeMessageSelection}
              onMoveMessageAfter={(message, afterMessageId) => void moveMessageAfter(message, afterMessageId)}
              onCopyMessage={copyMessage}
              onInsertMessage={insertMessageIntoChatGpt}
              onInsertMessageSection={(message, headingIndex) =>
                void insertMessageSectionIntoChatGpt(message, headingIndex)
              }
              onSaveMessageEdit={saveMessageEdit}
              onDeleteMessage={(message) => void deleteSingleMessage(message)}
              onDeleteMessageSection={(message, headingIndex) => void deleteMessageSection(message, headingIndex)}
              onDeleteSelectedText={removeSelectedText}
              onUndoMessageEdit={undoMessageEdit}
              onUndoDeletedMessage={() => void undoLastDeletedMessage()}
            />
          </section>
        </>
      ) : (
        <section className="notebook-home-page" aria-label="Notebooks">
          <ThreadList
            threads={threads}
            folders={folders}
            filter={threadFilter}
            newNotebookTitle={newNotebookTitle}
            newFolderTitle={newFolderTitle}
            themeToggle={themeToggle}
            selectedThreadId={selectedThreadId}
            isFullPage
            onFilterChange={setThreadFilter}
            onNewNotebookTitleChange={setNewNotebookTitle}
            onNewFolderTitleChange={setNewFolderTitle}
            onCreateNotebook={addNotebook}
            onCreateFolder={addFolder}
            onSelectThread={(threadId) => void selectThread(threadId)}
            onRenameThread={(threadId, title) => void updateSelectedThreadTitle(threadId, title)}
            onRenameFolder={(folderId, title) => void updateFolderTitle(folderId, title)}
            onMoveThreadToFolder={(thread, folderId) => void moveThreadFolder(thread, folderId)}
            onDeleteThread={(thread) => void removeThread(thread)}
            onDeleteFolder={(folder) => void removeFolder(folder)}
          />
          {feedback}
        </section>
      )}
    </main>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

function getMessageElement(messageId: string): HTMLElement | null {
  return (
    Array.from(document.querySelectorAll<HTMLElement>("[data-note-message-id]")).find(
      (element) => element.dataset.noteMessageId === messageId,
    ) ?? null
  );
}

function getStoredMessageMarkdown(message: SavedMessage): string {
  return (message.contentMarkdown || message.contentText).replace(/\r\n/g, "\n").trim();
}

function normalizeNotebookTitle(title: string | null | undefined): string {
  return (title ?? "").replace(/\s+/g, " ").trim();
}
