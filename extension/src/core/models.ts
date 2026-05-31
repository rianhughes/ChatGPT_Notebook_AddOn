export type ThreadSource = "chatgpt" | "deepwiki" | "notebook";

export type MessageRole = "assistant" | "user" | "system" | "note";

export type ChatGptThread = {
  id: string;
  source: ThreadSource;
  sourceThreadId: string;
  title: string;
  folderId?: string | null;
  messageCount: number;
  sortOrder?: number;
  createdAt: number;
  updatedAt: number;
};

export type NotebookFolder = {
  id: string;
  title: string;
  sortOrder?: number;
  createdAt: number;
  updatedAt: number;
};

export type NotebookAssetKind = "image";

export type NotebookAsset = {
  id: string;
  threadId: string;
  messageId: string | null;
  kind: NotebookAssetKind;
  mimeType: string;
  filename: string | null;
  altText: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  contentHash: string;
  blob: Blob;
  createdAt: number;
  updatedAt: number;
};

export type StoredNotebookBackup = {
  id: string;
  kind: "latest" | "daily";
  backupDate: string | null;
  filename: string;
  contents: string;
  dataRevision: number;
  exportedAt: string;
  createdAt: number;
  updatedAt: number;
};

export type AppSettingKey =
  | "activeSaveTargetThreadId"
  | "activeSaveTargetMessageId"
  | "dataRevision"
  | "lastBackupRevision"
  | "lastBackupAt"
  | "lastBackupError"
  | "lastDailyBackupDate"
  | "lastCloudBackupRevision"
  | "lastCloudBackupAt"
  | "lastCloudBackupError"
  | "cloudEncryptionEnabled"
  | "cloudEncryptionVersion"
  | "cloudEncryptionLocked"
  | "cloudKeyVersion"
  | "cloudLastDecryptError";

export type AppSetting = {
  key: AppSettingKey;
  value: string | null;
  updatedAt: number;
};

export type AiNotebookOperation =
  | {
      type: "create_note";
      threadId: string;
      contentMarkdown: string;
      title?: string | null;
      afterMessageId?: string | null;
    }
  | {
      type: "update_note";
      threadId: string;
      messageId: string;
      contentMarkdown: string;
      title?: string | null;
      expectedContentHash?: string | null;
    }
  | {
      type: "delete_note";
      threadId: string;
      messageId: string;
      expectedContentHash?: string | null;
    }
  | {
      type: "move_note";
      threadId: string;
      messageId: string;
      afterMessageId: string | null;
    }
  | {
      type: "merge_notes";
      threadId: string;
      messageIds: string[];
    }
  | {
      type: "create_notebook";
      title: string;
      folderId?: string | null;
    }
  | {
      type: "rename_notebook";
      threadId: string;
      title: string;
    }
  | {
      type: "delete_notebook";
      threadId: string;
    }
  | {
      type: "move_notebook_to_folder";
      threadId: string;
      folderId: string | null;
    }
  | {
      type: "create_folder";
      title: string;
    }
  | {
      type: "rename_folder";
      folderId: string;
      title: string;
    };

export type AiOperationPackage = {
  protocolVersion: 1;
  requestId: string;
  sourceThreadId: string;
  sourceTitle: string;
  operations: AiNotebookOperation[];
};

export type AiOperationProposal = {
  id: string;
  sourceThreadId: string;
  sourceTitle: string;
  package: AiOperationPackage;
  createdAt: number;
  updatedAt: number;
};

export type SavedMessage = {
  id: string;
  threadId: string;
  sourceMessageId: string | null;
  sourceMessageKey: string;
  contentHash: string;
  role: MessageRole;
  title?: string | null;
  contentMarkdown: string;
  contentText: string;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
};

export type ChatGptThreadInput = {
  source?: Extract<ThreadSource, "chatgpt" | "deepwiki">;
  sourceThreadId: string;
  title: string;
};

export type NotebookInput = {
  title: string;
  folderId?: string | null;
};

export type NotebookFolderInput = {
  title: string;
};

export type SaveChatGptMessageInput = {
  source?: Extract<ThreadSource, "chatgpt" | "deepwiki">;
  sourceThreadId: string;
  title: string;
  sourceMessageId: string | null;
  sourceMessageKey: string;
  contentHash: string;
  role: Extract<MessageRole, "assistant" | "user" | "system">;
  contentMarkdown: string;
  contentText: string;
  insertAfterId?: string | null;
};

export type AppendMessageInput = Omit<
  SavedMessage,
  "id" | "threadId" | "sortOrder" | "createdAt" | "updatedAt"
> & {
  id?: string;
  createdAt?: number;
  updatedAt?: number;
};

export type SaveMessageStatus = "created" | "already_saved" | "updated";

export type SaveChatGptMessageResult = {
  thread: ChatGptThread;
  message: SavedMessage;
  status: SaveMessageStatus;
};
