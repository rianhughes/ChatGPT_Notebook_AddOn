import browser from "../browser/extensionApi";
import {
  broadcastToChatGptTabs,
  ensureActiveCapturableContentScript,
  ensureChatGptContentScript,
  getActiveChatGptContext,
  sendMessageToActiveChatGptTab,
} from "../browser/tabs";
import {
  type ExtensionMessage,
  type AutosaveStatusResponse,
  type InsertTextInChatGptResponse,
  type OpenSidebarWindowResponse,
  type SaveChatGptMessageResponse,
  type SubmitAiOperationPackageResponse,
  isExtensionMessage,
} from "../core/ports";
import {
  appendSavedMessageFromChatGpt,
  getActiveSaveTargetThread,
  getSavedStateForVisibleMessages,
  saveAiOperationProposal,
  setActiveSaveTargetThread,
} from "../core/repository";
import { createSidebarAdapter } from "./sidebarAdapter";
import { forceNotebookAutosave, getAutosaveStatus, noteNotebookDataChanged } from "./autosave";
import { initializeDetachedSidebarWindowTracking, openDetachedSidebarWindow } from "./sidebarWindow";

type ActionClickTab = {
  id?: number;
  url?: string;
  windowId?: number;
};

type ActionApi = {
  onClicked?: {
    addListener(listener: (tab?: ActionClickTab) => void): void;
  };
};

const sidebarAdapter = createSidebarAdapter();

void sidebarAdapter.initialize();
initializeDetachedSidebarWindowTracking();

const actionApi = ((browser as unknown as { action?: ActionApi; browserAction?: ActionApi }).action ??
  (browser as unknown as { browserAction?: ActionApi }).browserAction) as ActionApi | undefined;

actionApi?.onClicked?.addListener((tab) => {
  void openSidebarFromActionClick(tab);
});

browser.runtime.onMessage.addListener((rawMessage: unknown) => {
  if (!isExtensionMessage(rawMessage)) {
    return undefined;
  }

  return handleMessage(rawMessage);
});

async function handleMessage(message: ExtensionMessage): Promise<unknown> {
  switch (message.type) {
    case "SAVE_CHATGPT_MESSAGE": {
      const result = await appendSavedMessageFromChatGpt(message.payload);
      await noteNotebookDataChanged();
      const response: SaveChatGptMessageResponse = {
        sourceThreadId: message.payload.sourceThreadId,
        sourceMessageKey: message.payload.sourceMessageKey,
        savedMessageId: result.message.id,
        status: result.status,
      };

      await broadcastToChatGptTabs({
        type: "SOURCE_MESSAGE_SAVED_STATE_CHANGED",
        payload: {
          sourceThreadId: message.payload.sourceThreadId,
          sourceMessageKey: message.payload.sourceMessageKey,
          saved: true,
        },
      });

      return response;
    }
    case "REQUEST_SAVED_STATE_FOR_VISIBLE_MESSAGES":
      return getSavedStateForVisibleMessages(
        message.payload.sourceThreadId,
        message.payload.sourceMessageKeys,
        message.payload.source === "deepwiki" ? "deepwiki" : "chatgpt",
      );
    case "GET_ACTIVE_CHATGPT_CONTEXT":
      await ensureActiveCapturableContentScript();
      return getActiveChatGptContext();
    case "GET_ACTIVE_SAVE_TARGET":
      return getActiveSaveTargetThread();
    case "SET_ACTIVE_SAVE_TARGET": {
      const thread = await setActiveSaveTargetThread(message.payload.threadId);
      await noteNotebookDataChanged();

      await broadcastToChatGptTabs({
        type: "ACTIVE_SAVE_TARGET_CHANGED",
        payload: {
          threadId: thread?.id ?? null,
          title: thread?.title ?? null,
          source: thread?.source ?? null,
        },
      });

      return thread;
    }
    case "INSERT_TEXT_IN_CHATGPT": {
      const response = await sendMessageToActiveChatGptTab<InsertTextInChatGptResponse>(message);
      return (
        response ?? {
          inserted: false,
          error: "Open a ChatGPT tab before inserting notes.",
        }
      );
    }
    case "SUBMIT_AI_OPERATION_PACKAGE": {
      try {
        const proposal = await saveAiOperationProposal(message.payload);
        await noteNotebookDataChanged();

        try {
          await openDetachedSidebarWindow();
        } catch {
          await sidebarAdapter.openForCurrentWindow({});
        }

        return {
          queued: true,
          proposalId: proposal.id,
        } satisfies SubmitAiOperationPackageResponse;
      } catch {
        return {
          queued: false,
          error: "Could not queue ChatGPT note changes.",
        } satisfies SubmitAiOperationPackageResponse;
      }
    }
    case "OPEN_SIDEBAR_WINDOW": {
      try {
        await openDetachedSidebarWindow();
        return { opened: true } satisfies OpenSidebarWindowResponse;
      } catch {
        return {
          opened: false,
          error: "Could not open notes window.",
        } satisfies OpenSidebarWindowResponse;
      }
    }
    case "NOTEBOOK_DATA_CHANGED":
      await noteNotebookDataChanged();
      return getAutosaveStatus();
    case "GET_AUTOSAVE_STATUS":
      return getAutosaveStatus() satisfies Promise<AutosaveStatusResponse>;
    case "FORCE_AUTOSAVE":
      return forceNotebookAutosave() satisfies Promise<AutosaveStatusResponse>;
    case "CHATGPT_THREAD_CHANGED":
    case "SAVE_CHATGPT_MESSAGE_RESULT":
    case "ACTIVE_SAVE_TARGET_CHANGED":
    case "SOURCE_MESSAGE_SAVED_STATE_CHANGED":
      return undefined;
    default:
      return undefined;
  }
}

async function openSidebarFromActionClick(tab?: ActionClickTab): Promise<void> {
  try {
    await sidebarAdapter.openForCurrentWindow({
      windowId: tab?.windowId,
      tabId: tab?.id,
    });
  } catch {
    // Chrome can already open the side panel via setPanelBehavior.
  }

  if (tab) {
    try {
      await ensureChatGptContentScript(tab);
    } catch {
      // The active tab may not allow script injection, or the script may already be present.
    }
  }
}
