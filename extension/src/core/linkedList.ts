import type { ChatGptThread, SavedMessage } from "./models";

export type MessageListState = {
  thread: ChatGptThread;
  messages: SavedMessage[];
};

export function appendMessage(state: MessageListState, message: SavedMessage): MessageListState {
  const nextState = cloneState(state);
  const nextMessage = prepareNewMessage(nextState, message);
  const tail = nextState.thread.tailMessageId ? findMessage(nextState, nextState.thread.tailMessageId) : null;

  if (!tail) {
    nextState.thread.headMessageId = nextMessage.id;
    nextState.thread.tailMessageId = nextMessage.id;
  } else {
    tail.nextId = nextMessage.id;
    nextMessage.prevId = tail.id;
    nextState.thread.tailMessageId = nextMessage.id;
  }

  nextState.messages.push(nextMessage);
  nextState.thread.messageCount += 1;
  nextState.thread.updatedAt = nextMessage.updatedAt;
  assertThreadIntegrity(nextState.thread, nextState.messages);
  return nextState;
}

export function insertMessageAfter(
  state: MessageListState,
  afterMessageId: string,
  message: SavedMessage,
): MessageListState {
  const nextState = cloneState(state);
  const after = findMessage(nextState, afterMessageId);
  const next = after.nextId ? findMessage(nextState, after.nextId) : null;
  const nextMessage = prepareNewMessage(nextState, message);

  nextMessage.prevId = after.id;
  nextMessage.nextId = next?.id ?? null;
  after.nextId = nextMessage.id;

  if (next) {
    next.prevId = nextMessage.id;
  } else {
    nextState.thread.tailMessageId = nextMessage.id;
  }

  nextState.messages.push(nextMessage);
  nextState.thread.messageCount += 1;
  nextState.thread.updatedAt = nextMessage.updatedAt;
  assertThreadIntegrity(nextState.thread, nextState.messages);
  return nextState;
}

export function insertMessageBefore(
  state: MessageListState,
  beforeMessageId: string,
  message: SavedMessage,
): MessageListState {
  const nextState = cloneState(state);
  const before = findMessage(nextState, beforeMessageId);
  const previous = before.prevId ? findMessage(nextState, before.prevId) : null;
  const nextMessage = prepareNewMessage(nextState, message);

  nextMessage.prevId = previous?.id ?? null;
  nextMessage.nextId = before.id;
  before.prevId = nextMessage.id;

  if (previous) {
    previous.nextId = nextMessage.id;
  } else {
    nextState.thread.headMessageId = nextMessage.id;
  }

  nextState.messages.push(nextMessage);
  nextState.thread.messageCount += 1;
  nextState.thread.updatedAt = nextMessage.updatedAt;
  assertThreadIntegrity(nextState.thread, nextState.messages);
  return nextState;
}

export function deleteMessage(state: MessageListState, messageId: string): MessageListState {
  const nextState = cloneState(state);
  const node = findMessage(nextState, messageId);
  const previous = node.prevId ? findMessage(nextState, node.prevId) : null;
  const next = node.nextId ? findMessage(nextState, node.nextId) : null;

  if (previous) {
    previous.nextId = next?.id ?? null;
  } else {
    nextState.thread.headMessageId = next?.id ?? null;
  }

  if (next) {
    next.prevId = previous?.id ?? null;
  } else {
    nextState.thread.tailMessageId = previous?.id ?? null;
  }

  nextState.messages = nextState.messages.filter((message) => message.id !== messageId);
  nextState.thread.messageCount -= 1;
  nextState.thread.updatedAt = Date.now();
  assertThreadIntegrity(nextState.thread, nextState.messages);
  return nextState;
}

export function moveMessageAfter(
  state: MessageListState,
  messageId: string,
  afterMessageId: string | null,
): MessageListState {
  if (messageId === afterMessageId) {
    return cloneState(state);
  }

  const message = findMessage(state, messageId);
  const detached: SavedMessage = { ...message, prevId: null, nextId: null, updatedAt: Date.now() };
  const withoutMessage = deleteMessage(state, messageId);

  if (afterMessageId === null) {
    const headId = withoutMessage.thread.headMessageId;
    return headId
      ? insertMessageBefore(withoutMessage, headId, detached)
      : appendMessage(withoutMessage, detached);
  }

  return insertMessageAfter(withoutMessage, afterMessageId, detached);
}

export function getMessagesInOrder(thread: ChatGptThread, messages: SavedMessage[]): SavedMessage[] {
  assertThreadIntegrity(thread, messages);

  const byId = new Map(messages.map((message) => [message.id, message]));
  const ordered: SavedMessage[] = [];
  let currentId = thread.headMessageId;

  while (currentId) {
    const current = byId.get(currentId);

    if (!current) {
      throw new Error(`Broken linked list: missing message ${currentId}`);
    }

    ordered.push(current);
    currentId = current.nextId;
  }

  return ordered;
}

export function assertThreadIntegrity(thread: ChatGptThread, messages: SavedMessage[]): void {
  if (thread.messageCount === 0) {
    if (thread.headMessageId !== null || thread.tailMessageId !== null) {
      throw new Error("Empty thread must not have head or tail pointers");
    }

    if (messages.length !== 0) {
      throw new Error("Empty thread must not have messages");
    }

    return;
  }

  if (!thread.headMessageId || !thread.tailMessageId) {
    throw new Error("Non-empty thread must have head and tail pointers");
  }

  if (messages.length !== thread.messageCount) {
    throw new Error("Thread messageCount does not match message table");
  }

  const byId = new Map(messages.map((message) => [message.id, message]));
  const head = byId.get(thread.headMessageId);
  const tail = byId.get(thread.tailMessageId);

  if (!head || !tail) {
    throw new Error("Thread head or tail pointer is missing");
  }

  if (head.prevId !== null) {
    throw new Error("Thread head must not point to a previous message");
  }

  if (tail.nextId !== null) {
    throw new Error("Thread tail must not point to a next message");
  }

  let previousId: string | null = null;
  let currentId: string | null = thread.headMessageId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) {
      throw new Error("Linked list cycle detected");
    }

    const current = byId.get(currentId);

    if (!current) {
      throw new Error(`Broken linked list: missing message ${currentId}`);
    }

    if (current.threadId !== thread.id) {
      throw new Error("Message points across thread boundaries");
    }

    if (current.prevId !== previousId) {
      throw new Error("Message previous pointer is inconsistent");
    }

    visited.add(currentId);
    previousId = currentId;
    currentId = current.nextId;
  }

  if (visited.size !== thread.messageCount) {
    throw new Error("Traversing from head did not visit messageCount messages");
  }

  if (previousId !== thread.tailMessageId) {
    throw new Error("Traversal did not end at the thread tail");
  }
}

function cloneState(state: MessageListState): MessageListState {
  return {
    thread: { ...state.thread },
    messages: state.messages.map((message) => ({ ...message })),
  };
}

function prepareNewMessage(state: MessageListState, message: SavedMessage): SavedMessage {
  if (message.threadId !== state.thread.id) {
    throw new Error("Cannot insert a message into a different thread");
  }

  if (state.messages.some((existing) => existing.id === message.id)) {
    throw new Error(`Message ${message.id} already exists`);
  }

  return { ...message, prevId: null, nextId: null };
}

function findMessage(state: MessageListState, messageId: string): SavedMessage {
  const message = state.messages.find((candidate) => candidate.id === messageId);

  if (!message) {
    throw new Error(`Missing message ${messageId}`);
  }

  if (message.threadId !== state.thread.id) {
    throw new Error(`Message ${messageId} belongs to another thread`);
  }

  return message;
}
