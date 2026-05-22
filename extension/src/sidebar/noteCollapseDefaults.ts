type MessageId = {
  id: string;
};

type SyncedDefaultCollapsedMessageIds = {
  collapsedMessageIds: Set<string>;
  knownMessageIds: Set<string>;
  changed: boolean;
};

export function syncDefaultCollapsedMessageIds(
  messages: readonly MessageId[],
  currentCollapsedMessageIds: Set<string>,
  knownMessageIds: Set<string>,
): SyncedDefaultCollapsedMessageIds {
  const nextKnownMessageIds = new Set(messages.map((message) => message.id));
  const nextCollapsedMessageIds = new Set<string>();
  let changed = false;

  currentCollapsedMessageIds.forEach((messageId) => {
    if (nextKnownMessageIds.has(messageId)) {
      nextCollapsedMessageIds.add(messageId);
    } else {
      changed = true;
    }
  });

  messages.forEach((message) => {
    if (!knownMessageIds.has(message.id)) {
      if (!nextCollapsedMessageIds.has(message.id)) {
        nextCollapsedMessageIds.add(message.id);
        changed = true;
      }
    }
  });

  return {
    collapsedMessageIds: changed ? nextCollapsedMessageIds : currentCollapsedMessageIds,
    knownMessageIds: nextKnownMessageIds,
    changed,
  };
}
