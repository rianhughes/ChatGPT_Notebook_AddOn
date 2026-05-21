import browser from "../browser/extensionApi";
import {
  broadcastToChatGptTabs,
  ensureChatGptContentScript,
  getActiveChatGptContext,
  sendMessageToActiveChatGptTab,
} from "../browser/tabs";
import {
  type ExtensionMessage,
  type InsertTextInChatGptResponse,
  type SaveChatGptMessageResponse,
  isExtensionMessage,
} from "../core/ports";
import {
  appendSavedMessageFromChatGpt,
  getActiveSaveTargetThread,
  getSavedStateForVisibleMessages,
  setActiveSaveTargetThread,
} from "../core/repository";
import { createSidebarAdapter } from "./sidebarAdapter";

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
      const response: SaveChatGptMessageResponse = {
        sourceThreadId: message.payload.sourceThreadId,
        sourceMessageKey: result.message.sourceMessageKey,
        savedMessageId: result.message.id,
        status: result.status,
      };

      await broadcastToChatGptTabs({
        type: "SOURCE_MESSAGE_SAVED_STATE_CHANGED",
        payload: {
          sourceThreadId: message.payload.sourceThreadId,
          sourceMessageKey: result.message.sourceMessageKey,
          saved: true,
        },
      });

      return response;
    }
    case "REQUEST_SAVED_STATE_FOR_VISIBLE_MESSAGES":
      return getSavedStateForVisibleMessages(
        message.payload.sourceThreadId,
        message.payload.sourceMessageKeys,
      );
    case "GET_ACTIVE_CHATGPT_CONTEXT":
      return getActiveChatGptContext();
    case "GET_ACTIVE_SAVE_TARGET":
      return getActiveSaveTargetThread();
    case "SET_ACTIVE_SAVE_TARGET": {
      const thread = await setActiveSaveTargetThread(message.payload.threadId);

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
  if (tab) {
    try {
      await ensureChatGptContentScript(tab);
    } catch {
      // The active tab may not allow script injection, or the script may already be present.
    }
  }

  try {
    await sidebarAdapter.openForCurrentWindow({
      windowId: tab?.windowId,
      tabId: tab?.id,
    });
  } catch {
    // Chrome can already open the side panel via setPanelBehavior.
  }
}
