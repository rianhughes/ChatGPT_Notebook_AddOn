export function normalizeForKey(input: string): string {
  return input.replace(/\s+/g, " ").trim().toLowerCase();
}

export function stableHash(input: string): string {
  let hash = 0x811c9dc5;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function sourceMessageKeyFromParts(input: {
  sourceMessageId: string | null;
  role: string;
  contentText: string;
}): string {
  if (input.sourceMessageId) {
    return `source:${input.sourceMessageId}`;
  }

  return `content:${stableHash(`${input.role}:${normalizeForKey(input.contentText)}`)}`;
}

export function contentHashFromParts(input: { contentMarkdown: string; contentText: string }): string {
  return stableHash(`${input.contentMarkdown}\n${normalizeForKey(input.contentText)}`);
}

export function createId(prefix: string): string {
  const randomId = globalThis.crypto?.randomUUID?.();

  if (randomId) {
    return `${prefix}_${randomId}`;
  }

  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}
