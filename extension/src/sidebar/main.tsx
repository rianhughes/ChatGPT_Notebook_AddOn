import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Moon, Sun, Sunset } from "lucide-react";

import "../styles/sidebar.css";
import type {
  ActiveChatGptContextResponse,
  ActiveSaveTargetResponse,
  InsertTextInChatGptResponse,
} from "../core/ports";
import { copyText, getMessageCopyText } from "../core/clipboard";
import type { ChatGptThread, SavedMessage } from "../core/models";
import { deleteHeadingSectionFromMarkdown, extractHeadingSectionFromMarkdown } from "../core/markdown";
import {
  createNotebookExportData,
  createNotebookExportFile,
  NOTEBOOK_EXPORT_FORMATTERS,
  type NotebookExportFormatId,
} from "../core/notebookExport";
import {
  createNotebook,
  deleteMessage,
  deleteSelectedTextFromMessage,
  deleteThread,
  getMessagesInOrder,
  getThreadBySource,
  getThreads,
  mergeMessages,
  reorderMessage,
  reorderThread,
  renameThreadTitle,
  updateMessageContent,
  type MessageMoveDirection,
  type ThreadMoveDirection,
} from "../core/repository";
import { filterMessagesBySearch } from "../core/search";
import { sendRuntimeMessage } from "../browser/runtime";
import { MessageList } from "./components/MessageList";
import { getHighlightedInsertText, getHighlightedText, selectionBelongsToElement } from "./insertSelection";
import type { ThemeMode } from "./theme";
import { applyTheme, getInitialTheme, getNextTheme, persistTheme } from "./theme";
import { ThreadList } from "./components/ThreadList";
import { Toolbar } from "./components/Toolbar";
import { downloadNotebookExport } from "./downloadExport";

const initialTheme = getInitialTheme();
applyTheme(initialTheme);
const MAX_UNDO_STEPS_PER_MESSAGE = 20;

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
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [threadFilter, setThreadFilter] = useState("");
  const [messageQuery, setMessageQuery] = useState("");
  const [newNotebookTitle, setNewNotebookTitle] = useState("");
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(() => new Set());
  const [messageUndoHistory, setMessageUndoHistory] = useState<Record<string, string[]>>({});
  const [collapsedMessageIds, setCollapsedMessageIds] = useState<Set<string>>(() => new Set());
  const [isReorderingMessages, setIsReorderingMessages] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const selectedThread = threads.find((thread) => thread.id === selectedThreadId) ?? null;
  const visibleMessages = useMemo(
    () => filterMessagesBySearch(messages, messageQuery),
    [messages, messageQuery],
  );
  const selectedVisibleMessages = visibleMessages.filter((message) => selectedMessageIds.has(message.id));
  const areAllVisibleMessagesCollapsed =
    visibleMessages.length > 0 && visibleMessages.every((message) => collapsedMessageIds.has(message.id));
  const undoableMessageIds = useMemo(
    () => new Set(Object.entries(messageUndoHistory).filter(([, history]) => history.length > 0).map(([id]) => id)),
    [messageUndoHistory],
  );

  useEffect(() => {
    applyTheme(theme);
    persistTheme(theme);
  }, [theme]);

  const loadThreads = useCallback(async () => {
    const nextThreads = await getThreads();
    setThreads(nextThreads);
    return nextThreads;
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
      const nextThreads = await loadThreads();

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

      setSelectedThreadId(nextThreads[0]?.id ?? null);
    })();
  }, [loadThreads]);

  useEffect(() => {
    void loadMessages(selectedThreadId);
    setIsReorderingMessages(false);
  }, [loadMessages, selectedThreadId]);

  useEffect(() => {
    if (messageQuery.trim()) {
      setIsReorderingMessages(false);
    }
  }, [messageQuery]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadThreads();
      void loadMessages(selectedThreadId);
    }, 1500);

    return () => window.clearInterval(intervalId);
  }, [loadMessages, loadThreads, selectedThreadId]);

  async function selectThread(threadId: string) {
    setSelectedThreadId(threadId);
    setMessageQuery("");
    setSelectedMessageIds(new Set());
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
      const nextThreads = await loadThreads();
      setSelectedMessageIds(new Set());
      setCollapsedMessageIds(new Set());
      setMessageUndoHistory({});

      if (selectedThreadId === thread.id) {
        const nextSelectedThreadId = nextThreads.find((nextThread) => nextThread.id !== thread.id)?.id ?? null;
        setSelectedThreadId(nextSelectedThreadId);
        await loadMessages(nextSelectedThreadId);
      } else {
        await loadMessages(selectedThreadId);
      }

      setStatus("Deleted notebook");
    } catch {
      setError("Could not delete notebook.");
    }
  }

  async function moveThreadInList(thread: ChatGptThread, direction: ThreadMoveDirection) {
    setError("");
    setStatus("");

    try {
      setThreads(await reorderThread(thread.id, direction));
      setStatus(`Moved ${thread.title} ${direction}`);
    } catch {
      setError("Could not reorder notebooks.");
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

  async function updateSelectedThreadTitle(threadId: string, title: string) {
    setError("");
    setStatus("");

    try {
      const updated = await renameThreadTitle(threadId, title);
      await loadThreads();
      setStatus(`Renamed to ${updated.title}`);
    } catch {
      setError("Could not rename notebook.");
    }
  }

  function toggleMessageSelection(messageId: string) {
    setSelectedMessageIds((current) => {
      const next = new Set(current);

      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }

      return next;
    });
  }

  async function moveMessageInList(message: SavedMessage, direction: MessageMoveDirection) {
    setError("");
    setStatus("");

    try {
      setMessages(await reorderMessage(message.threadId, message.id, direction));
      setStatus(`Moved note ${direction}`);
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

    try {
      await updateMessageContent(message.threadId, message.id, nextMarkdown, title);
      if (previousMarkdown !== nextMarkdown) {
        pushMessageUndoSnapshot(message.id, previousMarkdown);
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

    const updatedMessage = await deleteSelectedTextFromMessage(message.threadId, message.id, selectedText);

    if (!updatedMessage) {
      setError("That highlight could not be matched in the stored note.");
      return;
    }

    pushMessageUndoSnapshot(message.id, getStoredMessageMarkdown(message));
    selection.removeAllRanges();
    setStatus("Deleted highlighted text");
    await loadMessages(message.threadId);
    await loadThreads();
  }

  async function deleteSelectedMessages() {
    setError("");
    setStatus("");

    if (selectedVisibleMessages.length === 0) {
      setError("Select a note first.");
      return;
    }

    try {
      await Promise.all(selectedVisibleMessages.map((message) => deleteMessage(message.threadId, message.id)));
      setSelectedMessageIds((current) => {
        const next = new Set(current);
        selectedVisibleMessages.forEach((message) => next.delete(message.id));
        return next;
      });
      setStatus(`Deleted ${selectedVisibleMessages.length} ${selectedVisibleMessages.length === 1 ? "note" : "notes"}`);
      await loadMessages(selectedThreadId);
      await loadThreads();
    } catch {
      setError("Could not delete selected notes.");
    }
  }

  async function mergeSelectedMessages() {
    setError("");
    setStatus("");

    if (!selectedThreadId || selectedVisibleMessages.length < 2) {
      setError("Select at least two notes to merge.");
      return;
    }

    try {
      const mergedMessage = await mergeMessages(
        selectedThreadId,
        selectedVisibleMessages.map((message) => message.id),
      );

      if (!mergedMessage) {
        setError("Select at least two notes to merge.");
        return;
      }

      setSelectedMessageIds(new Set([mergedMessage.id]));
      setStatus(`Merged ${selectedVisibleMessages.length} notes`);
      await loadMessages(selectedThreadId);
      await loadThreads();
    } catch {
      setError("Could not merge selected notes.");
    }
  }

  async function deleteSingleMessage(message: SavedMessage) {
    setError("");
    setStatus("");

    try {
      await deleteMessage(message.threadId, message.id);
      setSelectedMessageIds((current) => {
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

    try {
      await updateMessageContent(message.threadId, message.id, nextMarkdown);
      pushMessageUndoSnapshot(message.id, previousMarkdown);
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

    try {
      await updateMessageContent(message.threadId, message.id, previousMarkdown);
      popMessageUndoSnapshot(message.id);
      setStatus("Undid last note edit");
      await loadMessages(message.threadId);
      await loadThreads();
    } catch {
      setError("Could not undo note edit.");
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

  return (
    <main className="app-shell">
      <ThreadList
        threads={threads}
        filter={threadFilter}
        newNotebookTitle={newNotebookTitle}
        themeToggle={
          <button
            className="icon-button theme-toggle-button"
            type="button"
            title={`Current theme: ${themeLabels[theme]}. Switch to ${themeLabels[getNextTheme(theme)]} mode`}
            aria-label={`Current theme: ${themeLabels[theme]}. Switch to ${themeLabels[getNextTheme(theme)]} mode`}
            onClick={() => setTheme((currentTheme) => getNextTheme(currentTheme))}
          >
            {getThemeIcon(theme)}
          </button>
        }
        selectedThreadId={selectedThreadId}
        onFilterChange={setThreadFilter}
        onNewNotebookTitleChange={setNewNotebookTitle}
        onCreateNotebook={addNotebook}
        onSelectThread={(threadId) => void selectThread(threadId)}
        onMoveThread={(thread, direction) => void moveThreadInList(thread, direction)}
        onDeleteThread={(thread) => void removeThread(thread)}
      />

      <Toolbar
        selectedThread={selectedThread}
        searchQuery={messageQuery}
        selectedCount={selectedVisibleMessages.length}
        canCollapseMessages={visibleMessages.length > 0}
        areAllMessagesCollapsed={areAllVisibleMessagesCollapsed}
        canReorderMessages={messages.length > 1 && !messageQuery.trim()}
        isReorderingMessages={isReorderingMessages}
        exportFormats={NOTEBOOK_EXPORT_FORMATTERS}
        onSearchChange={setMessageQuery}
        onRenameThread={updateSelectedThreadTitle}
        onRequestExport={(formatId) => void exportSelectedNotebook(formatId)}
        onToggleAllMessagesCollapsed={toggleAllVisibleMessagesCollapsed}
        onToggleMessageReorder={() => setIsReorderingMessages((isReordering) => !isReordering)}
        onMergeSelectedMessages={() => void mergeSelectedMessages()}
        onDeleteSelectedMessages={() => void deleteSelectedMessages()}
      />

      <section className="message-panel" aria-label="Saved messages">
        <div className="message-feedback" aria-live="polite">
          {status ? <span className="copy-status">{status}</span> : null}
          {error ? <span className="error-text">{error}</span> : null}
        </div>
        <MessageList
          messages={visibleMessages}
          selectedMessageIds={selectedMessageIds}
          undoableMessageIds={undoableMessageIds}
          collapsedMessageIds={collapsedMessageIds}
          reorderMode={isReorderingMessages}
          onCollapsedMessageIdsChange={setCollapsedMessageIds}
          onToggleSelection={toggleMessageSelection}
          onMoveMessage={(message, direction) => void moveMessageInList(message, direction)}
          onCopyMessage={copyMessage}
          onInsertMessage={insertMessageIntoChatGpt}
          onInsertMessageSection={(message, headingIndex) => void insertMessageSectionIntoChatGpt(message, headingIndex)}
          onSaveMessageEdit={saveMessageEdit}
          onDeleteMessage={(message) => void deleteSingleMessage(message)}
          onDeleteMessageSection={(message, headingIndex) => void deleteMessageSection(message, headingIndex)}
          onDeleteSelectedText={removeSelectedText}
          onUndoMessageEdit={undoMessageEdit}
        />
      </section>
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
