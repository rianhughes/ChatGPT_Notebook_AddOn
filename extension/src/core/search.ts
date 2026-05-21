import type { SavedMessage } from "./models";

export function normalizeSearchText(input: string): string {
  return input.replace(/\s+/g, " ").trim().toLowerCase();
}

export function filterMessagesBySearch(messages: SavedMessage[], query: string): SavedMessage[] {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return messages;
  }

  return messages.filter((message) => normalizeSearchText(message.contentText).includes(normalizedQuery));
}
