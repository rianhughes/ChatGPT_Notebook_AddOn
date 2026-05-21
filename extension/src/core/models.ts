export type ThreadSource = "chatgpt" | "notebook";

export type MessageRole = "assistant" | "user" | "system" | "note";

export type ChatGptThread = {
  id: string;
  source: ThreadSource;
  sourceThreadId: string;
  title: string;
  headMessageId: string | null;
  tailMessageId: string | null;
  messageCount: number;
  sortOrder?: number;
  createdAt: number;
  updatedAt: number;
};

export type AppSettingKey = "activeSaveTargetThreadId";

export type AppSetting = {
  key: AppSettingKey;
  value: string | null;
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
  prevId: string | null;
  nextId: string | null;
  createdAt: number;
  updatedAt: number;
};

export type ChatGptThreadInput = {
  sourceThreadId: string;
  title: string;
};

export type NotebookInput = {
  title: string;
};

export type SaveChatGptMessageInput = {
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
  "id" | "threadId" | "prevId" | "nextId" | "createdAt" | "updatedAt"
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
