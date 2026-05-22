import type { ChatGptThread, SavedMessage } from "./models";

export function getMessagesInOrder(_thread: ChatGptThread, messages: SavedMessage[]): SavedMessage[] {
  if (messages.length === 0) {
    return [];
  }

  return [...messages].sort(compareMessagesBySortOrder);
}

export function renumberMessages(messages: SavedMessage[]): SavedMessage[] {
  return messages.map((message, index) => ({
    ...message,
    sortOrder: index,
  }));
}

export function insertMessageAfter(
  orderedMessages: SavedMessage[],
  message: SavedMessage,
  afterMessageId: string | null,
): SavedMessage[] {
  const withoutMessage = orderedMessages.filter((item) => item.id !== message.id);
  const insertIndex = getInsertIndexAfter(withoutMessage, afterMessageId);

  return renumberMessages([
    ...withoutMessage.slice(0, insertIndex),
    message,
    ...withoutMessage.slice(insertIndex),
  ]);
}

export function insertMessageBySortOrder(
  orderedMessages: SavedMessage[],
  message: SavedMessage,
): SavedMessage[] {
  const withoutMessage = orderedMessages.filter((item) => item.id !== message.id);
  const insertIndex = withoutMessage.findIndex((item) => item.sortOrder >= message.sortOrder);

  if (insertIndex === -1) {
    return renumberMessages([...withoutMessage, message]);
  }

  return renumberMessages([
    ...withoutMessage.slice(0, insertIndex),
    message,
    ...withoutMessage.slice(insertIndex),
  ]);
}

export function moveMessageAfter(
  orderedMessages: SavedMessage[],
  messageId: string,
  afterMessageId: string | null,
): SavedMessage[] {
  const message = orderedMessages.find((item) => item.id === messageId);

  if (!message) {
    throw new Error(`Missing message ${messageId}`);
  }

  if (messageId === afterMessageId) {
    return renumberMessages(orderedMessages);
  }

  return insertMessageAfter(orderedMessages, message, afterMessageId);
}

function getInsertIndexAfter(orderedMessages: SavedMessage[], afterMessageId: string | null): number {
  if (afterMessageId === null) {
    return 0;
  }

  const afterIndex = orderedMessages.findIndex((message) => message.id === afterMessageId);

  if (afterIndex === -1) {
    throw new Error(`Missing target message ${afterMessageId}`);
  }

  return afterIndex + 1;
}

function compareMessagesBySortOrder(left: SavedMessage, right: SavedMessage): number {
  if (left.sortOrder !== right.sortOrder) {
    return left.sortOrder - right.sortOrder;
  }

  return compareMessagesByCreatedAt(left, right);
}

function compareMessagesByCreatedAt(left: SavedMessage, right: SavedMessage): number {
  if (left.createdAt !== right.createdAt) {
    return left.createdAt - right.createdAt;
  }

  return left.id.localeCompare(right.id);
}
