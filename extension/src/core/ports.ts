import type { ChatGptContext } from "./threadIdentity";
import type { ChatGptThread, MessageRole, SaveChatGptMessageInput, SaveMessageStatus } from "./models";

export type RuntimeMessageType =
  | "CHATGPT_THREAD_CHANGED"
  | "SAVE_CHATGPT_MESSAGE"
  | "SAVE_CHATGPT_MESSAGE_RESULT"
  | "GET_ACTIVE_CHATGPT_CONTEXT"
  | "GET_ACTIVE_SAVE_TARGET"
  | "SET_ACTIVE_SAVE_TARGET"
  | "ACTIVE_SAVE_TARGET_CHANGED"
  | "INSERT_TEXT_IN_CHATGPT"
  | "SOURCE_MESSAGE_SAVED_STATE_CHANGED"
  | "REQUEST_SAVED_STATE_FOR_VISIBLE_MESSAGES";

export type ChatGptThreadChangedMessage = {
  type: "CHATGPT_THREAD_CHANGED";
  payload: { sourceThreadId: string; title: string; url: string };
};

export type SaveChatGptMessage = {
  type: "SAVE_CHATGPT_MESSAGE";
  payload: SaveChatGptMessageInput;
};

export type SaveChatGptMessageResultMessage = {
  type: "SAVE_CHATGPT_MESSAGE_RESULT";
  payload: {
    sourceThreadId: string;
    sourceMessageKey: string;
    savedMessageId: string;
    status: SaveMessageStatus;
  };
};

export type GetActiveChatGptContextMessage = {
  type: "GET_ACTIVE_CHATGPT_CONTEXT";
  payload: Record<string, never>;
};

export type GetActiveSaveTargetMessage = {
  type: "GET_ACTIVE_SAVE_TARGET";
  payload: Record<string, never>;
};

export type SetActiveSaveTargetMessage = {
  type: "SET_ACTIVE_SAVE_TARGET";
  payload: { threadId: string | null };
};

export type ActiveSaveTargetChangedMessage = {
  type: "ACTIVE_SAVE_TARGET_CHANGED";
  payload: {
    threadId: string | null;
    title: string | null;
    source: ChatGptThread["source"] | null;
  };
};

export type InsertTextInChatGptMessage = {
  type: "INSERT_TEXT_IN_CHATGPT";
  payload: { text: string };
};

export type SourceMessageSavedStateChangedMessage = {
  type: "SOURCE_MESSAGE_SAVED_STATE_CHANGED";
  payload: {
    sourceThreadId: string;
    sourceMessageKey: string;
    saved: boolean;
  };
};

export type RequestSavedStateForVisibleMessagesMessage = {
  type: "REQUEST_SAVED_STATE_FOR_VISIBLE_MESSAGES";
  payload: {
    sourceThreadId: string;
    sourceMessageKeys: string[];
  };
};

export type ExtensionMessage =
  | ChatGptThreadChangedMessage
  | SaveChatGptMessage
  | SaveChatGptMessageResultMessage
  | GetActiveChatGptContextMessage
  | GetActiveSaveTargetMessage
  | SetActiveSaveTargetMessage
  | ActiveSaveTargetChangedMessage
  | InsertTextInChatGptMessage
  | SourceMessageSavedStateChangedMessage
  | RequestSavedStateForVisibleMessagesMessage;

export type SaveChatGptMessageResponse = {
  sourceThreadId: string;
  sourceMessageKey: string;
  savedMessageId: string;
  status: SaveMessageStatus;
};

export type SavedStateResponse = Record<string, boolean>;

export type ActiveChatGptContextResponse = ChatGptContext | null;

export type ActiveSaveTargetResponse = ChatGptThread | null;

export type InsertTextInChatGptResponse = {
  inserted: boolean;
  error?: string;
};

export function isExtensionMessage(value: unknown): value is ExtensionMessage {
  if (!isRecord(value) || typeof value.type !== "string" || !isRecord(value.payload)) {
    return false;
  }

  switch (value.type) {
    case "CHATGPT_THREAD_CHANGED":
      return (
        typeof value.payload.sourceThreadId === "string" &&
        typeof value.payload.title === "string" &&
        typeof value.payload.url === "string"
      );
    case "SAVE_CHATGPT_MESSAGE":
      return isSaveChatGptPayload(value.payload);
    case "SAVE_CHATGPT_MESSAGE_RESULT":
      return (
        typeof value.payload.sourceThreadId === "string" &&
        typeof value.payload.sourceMessageKey === "string" &&
        typeof value.payload.savedMessageId === "string" &&
        isSaveStatus(value.payload.status)
      );
    case "GET_ACTIVE_CHATGPT_CONTEXT":
      return true;
    case "GET_ACTIVE_SAVE_TARGET":
      return true;
    case "SET_ACTIVE_SAVE_TARGET":
      return typeof value.payload.threadId === "string" || value.payload.threadId === null;
    case "ACTIVE_SAVE_TARGET_CHANGED":
      return (
        (typeof value.payload.threadId === "string" || value.payload.threadId === null) &&
        (typeof value.payload.title === "string" || value.payload.title === null) &&
        (value.payload.source === "chatgpt" ||
          value.payload.source === "notebook" ||
          value.payload.source === null)
      );
    case "INSERT_TEXT_IN_CHATGPT":
      return typeof value.payload.text === "string";
    case "SOURCE_MESSAGE_SAVED_STATE_CHANGED":
      return (
        typeof value.payload.sourceThreadId === "string" &&
        typeof value.payload.sourceMessageKey === "string" &&
        typeof value.payload.saved === "boolean"
      );
    case "REQUEST_SAVED_STATE_FOR_VISIBLE_MESSAGES":
      return (
        typeof value.payload.sourceThreadId === "string" &&
        Array.isArray(value.payload.sourceMessageKeys) &&
        value.payload.sourceMessageKeys.every((key) => typeof key === "string")
      );
    default:
      return false;
  }
}

function isSaveChatGptPayload(value: Record<string, unknown>): value is SaveChatGptMessageInput {
  return (
    typeof value.sourceThreadId === "string" &&
    typeof value.title === "string" &&
    (typeof value.sourceMessageId === "string" || value.sourceMessageId === null) &&
    typeof value.sourceMessageKey === "string" &&
    typeof value.contentHash === "string" &&
    isMessageRole(value.role) &&
    typeof value.contentMarkdown === "string" &&
    typeof value.contentText === "string" &&
    (value.insertAfterId === undefined ||
      value.insertAfterId === null ||
      typeof value.insertAfterId === "string")
  );
}

function isMessageRole(value: unknown): value is Extract<MessageRole, "assistant" | "user" | "system"> {
  return value === "assistant" || value === "user" || value === "system";
}

function isSaveStatus(value: unknown): value is SaveMessageStatus {
  return value === "created" || value === "already_saved" || value === "updated";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
