const CHATGPT_HOSTS = new Set(["chatgpt.com", "chat.openai.com"]);

export type ChatGptContext = {
  sourceThreadId: string;
  title: string;
  url: string;
};

export function parseChatGptConversationId(input: string | URL): string | null {
  const url = typeof input === "string" ? safeUrl(input) : input;

  if (!url || !isChatGptUrl(url)) {
    return null;
  }

  const [, firstSegment, secondSegment] = url.pathname.split("/");

  if (firstSegment !== "c" || !secondSegment) {
    return null;
  }

  return decodeURIComponent(secondSegment);
}

export function isChatGptUrl(input: string | URL): boolean {
  const url = typeof input === "string" ? safeUrl(input) : input;
  return Boolean(url && CHATGPT_HOSTS.has(url.hostname));
}

export function isChatGptConversationUrl(input: string | URL): boolean {
  return parseChatGptConversationId(input) !== null;
}

function safeUrl(input: string): URL | null {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}
