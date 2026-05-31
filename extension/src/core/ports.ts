import type { ChatGptContext } from "./threadIdentity";
import type { CloudBackupListItem } from "./cloudBackup";
import type {
  AiOperationPackage,
  ChatGptThread,
  MessageRole,
  SaveChatGptMessageInput,
  SaveMessageStatus,
} from "./models";

export type RuntimeMessageType =
  | "CHATGPT_THREAD_CHANGED"
  | "SAVE_CHATGPT_MESSAGE"
  | "SAVE_CHATGPT_MESSAGE_RESULT"
  | "GET_ACTIVE_CHATGPT_CONTEXT"
  | "GET_ACTIVE_SAVE_TARGET"
  | "SET_ACTIVE_SAVE_TARGET"
  | "ACTIVE_SAVE_TARGET_CHANGED"
  | "OPEN_SIDEBAR_WINDOW"
  | "INSERT_TEXT_IN_CHATGPT"
  | "SUBMIT_AI_OPERATION_PACKAGE"
  | "SOURCE_MESSAGE_SAVED_STATE_CHANGED"
  | "REQUEST_SAVED_STATE_FOR_VISIBLE_MESSAGES"
  | "NOTEBOOK_DATA_CHANGED"
  | "GET_AUTOSAVE_STATUS"
  | "FORCE_AUTOSAVE"
  | "GET_CLOUD_BACKUP_STATUS"
  | "START_GOOGLE_SIGN_IN"
  | "SIGN_OUT_CLOUD"
  | "SETUP_ENCRYPTED_CLOUD_SYNC"
  | "UNLOCK_CLOUD_SYNC_WITH_PASSPHRASE"
  | "UNLOCK_CLOUD_SYNC_WITH_RECOVERY_PHRASE"
  | "ROTATE_CLOUD_SYNC_PASSPHRASE"
  | "LOCK_CLOUD_SYNC"
  | "FORCE_CLOUD_BACKUP"
  | "LIST_CLOUD_BACKUPS"
  | "RESTORE_CLOUD_BACKUP"
  | "DELETE_CLOUD_BACKUPS";

export type ChatGptThreadChangedMessage = {
  type: "CHATGPT_THREAD_CHANGED";
  payload: { source?: ChatGptThread["source"]; sourceThreadId: string; title: string; url: string };
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

export type OpenSidebarWindowMessage = {
  type: "OPEN_SIDEBAR_WINDOW";
  payload: Record<string, never>;
};

export type SubmitAiOperationPackageMessage = {
  type: "SUBMIT_AI_OPERATION_PACKAGE";
  payload: AiOperationPackage;
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
    source?: ChatGptThread["source"];
    sourceThreadId: string;
    sourceMessageKeys: string[];
  };
};

export type NotebookDataChangedMessage = {
  type: "NOTEBOOK_DATA_CHANGED";
  payload: { reason: string };
};

export type GetAutosaveStatusMessage = {
  type: "GET_AUTOSAVE_STATUS";
  payload: Record<string, never>;
};

export type ForceAutosaveMessage = {
  type: "FORCE_AUTOSAVE";
  payload: Record<string, never>;
};

export type GetCloudBackupStatusMessage = {
  type: "GET_CLOUD_BACKUP_STATUS";
  payload: Record<string, never>;
};

export type StartGoogleSignInMessage = {
  type: "START_GOOGLE_SIGN_IN";
  payload: Record<string, never>;
};

export type SignOutCloudMessage = {
  type: "SIGN_OUT_CLOUD";
  payload: Record<string, never>;
};

export type SetupEncryptedCloudSyncMessage = {
  type: "SETUP_ENCRYPTED_CLOUD_SYNC";
  payload: { passphrase: string };
};

export type UnlockCloudSyncWithPassphraseMessage = {
  type: "UNLOCK_CLOUD_SYNC_WITH_PASSPHRASE";
  payload: { passphrase: string };
};

export type UnlockCloudSyncWithRecoveryPhraseMessage = {
  type: "UNLOCK_CLOUD_SYNC_WITH_RECOVERY_PHRASE";
  payload: { recoveryPhrase: string };
};

export type RotateCloudSyncPassphraseMessage = {
  type: "ROTATE_CLOUD_SYNC_PASSPHRASE";
  payload: { currentPassphrase?: string; newPassphrase: string };
};

export type LockCloudSyncMessage = {
  type: "LOCK_CLOUD_SYNC";
  payload: Record<string, never>;
};

export type ForceCloudBackupMessage = {
  type: "FORCE_CLOUD_BACKUP";
  payload: Record<string, never>;
};

export type ListCloudBackupsMessage = {
  type: "LIST_CLOUD_BACKUPS";
  payload: Record<string, never>;
};

export type RestoreCloudBackupMessage = {
  type: "RESTORE_CLOUD_BACKUP";
  payload: { backupId: string };
};

export type DeleteCloudBackupsMessage = {
  type: "DELETE_CLOUD_BACKUPS";
  payload: Record<string, never>;
};

export type ExtensionMessage =
  | ChatGptThreadChangedMessage
  | SaveChatGptMessage
  | SaveChatGptMessageResultMessage
  | GetActiveChatGptContextMessage
  | GetActiveSaveTargetMessage
  | SetActiveSaveTargetMessage
  | ActiveSaveTargetChangedMessage
  | OpenSidebarWindowMessage
  | InsertTextInChatGptMessage
  | SubmitAiOperationPackageMessage
  | SourceMessageSavedStateChangedMessage
  | RequestSavedStateForVisibleMessagesMessage
  | NotebookDataChangedMessage
  | GetAutosaveStatusMessage
  | ForceAutosaveMessage
  | GetCloudBackupStatusMessage
  | StartGoogleSignInMessage
  | SignOutCloudMessage
  | SetupEncryptedCloudSyncMessage
  | UnlockCloudSyncWithPassphraseMessage
  | UnlockCloudSyncWithRecoveryPhraseMessage
  | RotateCloudSyncPassphraseMessage
  | LockCloudSyncMessage
  | ForceCloudBackupMessage
  | ListCloudBackupsMessage
  | RestoreCloudBackupMessage
  | DeleteCloudBackupsMessage;

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

export type OpenSidebarWindowResponse = {
  opened: boolean;
  error?: string;
};

export type SubmitAiOperationPackageResponse = {
  queued: boolean;
  proposalId?: string;
  error?: string;
};

export type AutosaveStatusState = "idle" | "pending" | "saving" | "error";

export type AutosaveStatusResponse = {
  state: AutosaveStatusState;
  dataRevision: number;
  lastBackupRevision: number;
  lastBackupAt: string | null;
  lastBackupError: string | null;
};

export type CloudBackupStatusState = "disabled" | "signed_out" | "locked" | "idle" | "pending" | "uploading" | "error";

export type CloudBackupStatusResponse = {
  configured: boolean;
  signedIn: boolean;
  state: CloudBackupStatusState;
  user: {
    id: string;
    email: string | null;
  } | null;
  dataRevision: number;
  lastCloudBackupRevision: number;
  lastCloudBackupAt: string | null;
  lastCloudBackupError: string | null;
  cloudEncryptionEnabled: boolean;
  cloudEncryptionLocked: boolean;
  cloudEncryptionVersion: number;
  cloudKeyVersion: number;
  cloudLastDecryptError: string | null;
  latestBackupId: string | null;
};

export type SetupEncryptedCloudSyncResponse = {
  enabled: boolean;
  recoveryPhrase?: string;
  status: CloudBackupStatusResponse;
  error?: string;
};

export type UnlockCloudSyncResponse = {
  unlocked: boolean;
  status: CloudBackupStatusResponse;
  error?: string;
};

export type RotateCloudSyncPassphraseResponse = {
  rotated: boolean;
  status: CloudBackupStatusResponse;
  error?: string;
};

export type LockCloudSyncResponse = {
  locked: boolean;
  status: CloudBackupStatusResponse;
  error?: string;
};

export type CloudBackupListResponse = {
  backups: CloudBackupListItem[];
};

export type RestoreCloudBackupResponse = {
  restored: boolean;
  backupId?: string;
  counts?: {
    folders: number;
    threads: number;
    messages: number;
    settings: number;
    aiOperationProposals: number;
    assets: number;
  };
  error?: string;
};

export type DeleteCloudBackupsResponse = {
  deleted: boolean;
  objectsDeleted?: number;
  error?: string;
};

export function isExtensionMessage(value: unknown): value is ExtensionMessage {
  if (!isRecord(value) || typeof value.type !== "string" || !isRecord(value.payload)) {
    return false;
  }

  switch (value.type) {
    case "CHATGPT_THREAD_CHANGED":
      return (
        isOptionalCapturableSource(value.payload.source) &&
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
          value.payload.source === "deepwiki" ||
          value.payload.source === "notebook" ||
          value.payload.source === null)
      );
    case "OPEN_SIDEBAR_WINDOW":
      return true;
    case "INSERT_TEXT_IN_CHATGPT":
      return typeof value.payload.text === "string";
    case "SUBMIT_AI_OPERATION_PACKAGE":
      return isAiOperationPackage(value.payload);
    case "SOURCE_MESSAGE_SAVED_STATE_CHANGED":
      return (
        typeof value.payload.sourceThreadId === "string" &&
        typeof value.payload.sourceMessageKey === "string" &&
        typeof value.payload.saved === "boolean"
      );
    case "REQUEST_SAVED_STATE_FOR_VISIBLE_MESSAGES":
      return (
        isOptionalCapturableSource(value.payload.source) &&
        typeof value.payload.sourceThreadId === "string" &&
        Array.isArray(value.payload.sourceMessageKeys) &&
        value.payload.sourceMessageKeys.every((key) => typeof key === "string")
      );
    case "NOTEBOOK_DATA_CHANGED":
      return typeof value.payload.reason === "string";
    case "GET_AUTOSAVE_STATUS":
      return true;
    case "FORCE_AUTOSAVE":
      return true;
    case "GET_CLOUD_BACKUP_STATUS":
      return true;
    case "START_GOOGLE_SIGN_IN":
      return true;
    case "SIGN_OUT_CLOUD":
      return true;
    case "SETUP_ENCRYPTED_CLOUD_SYNC":
      return typeof value.payload.passphrase === "string";
    case "UNLOCK_CLOUD_SYNC_WITH_PASSPHRASE":
      return typeof value.payload.passphrase === "string";
    case "UNLOCK_CLOUD_SYNC_WITH_RECOVERY_PHRASE":
      return typeof value.payload.recoveryPhrase === "string";
    case "ROTATE_CLOUD_SYNC_PASSPHRASE":
      return (
        (value.payload.currentPassphrase === undefined || typeof value.payload.currentPassphrase === "string") &&
        typeof value.payload.newPassphrase === "string"
      );
    case "LOCK_CLOUD_SYNC":
      return true;
    case "FORCE_CLOUD_BACKUP":
      return true;
    case "LIST_CLOUD_BACKUPS":
      return true;
    case "RESTORE_CLOUD_BACKUP":
      return typeof value.payload.backupId === "string";
    case "DELETE_CLOUD_BACKUPS":
      return true;
    default:
      return false;
  }
}

function isSaveChatGptPayload(value: Record<string, unknown>): value is SaveChatGptMessageInput {
  return (
    isOptionalCapturableSource(value.source) &&
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

function isOptionalCapturableSource(
  value: unknown,
): value is Extract<ChatGptThread["source"], "chatgpt" | "deepwiki"> | undefined {
  return value === undefined || value === "chatgpt" || value === "deepwiki";
}

function isSaveStatus(value: unknown): value is SaveMessageStatus {
  return value === "created" || value === "already_saved" || value === "updated";
}

function isAiOperationPackage(value: Record<string, unknown>): value is AiOperationPackage {
  return (
    value.protocolVersion === 1 &&
    typeof value.requestId === "string" &&
    typeof value.sourceThreadId === "string" &&
    typeof value.sourceTitle === "string" &&
    Array.isArray(value.operations) &&
    value.operations.length > 0
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
