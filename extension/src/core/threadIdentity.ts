import type { ThreadSource } from "./models";

const CHATGPT_HOSTS = new Set(["chatgpt.com", "chat.openai.com"]);
const DEEPWIKI_HOSTS = new Set(["deepwiki.com", "www.deepwiki.com"]);

export type CapturableThreadSource = Extract<ThreadSource, "chatgpt" | "deepwiki">;

export type SourceContext = {
  source: CapturableThreadSource;
  sourceThreadId: string;
  title: string;
  url: string;
};

export type ChatGptContext = SourceContext;

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

export type DeepWikiPageIdentity = {
  sourceThreadId: string;
  owner?: string;
  repo?: string;
  route: string;
  fallbackTitle: string;
};

export function parseDeepWikiPageIdentity(input: string | URL): DeepWikiPageIdentity | null {
  const url = typeof input === "string" ? safeUrl(input) : input;

  if (!url || !isDeepWikiUrl(url)) {
    return null;
  }

  const segments = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);

  if (segments.length === 0) {
    return null;
  }

  if (segments[0] === "search") {
    const searchId = segments[1] || "search";
    return {
      sourceThreadId: `deepwiki:search:${searchId}`,
      route: segments.slice(1).join("/") || "search",
      fallbackTitle: titleFromSlug(searchId) || "DeepWiki search",
    };
  }

  if (segments[0].startsWith("_") || segments[0] === "api") {
    return null;
  }

  const [owner, repo, ...routeParts] = segments;

  if (!owner || !repo) {
    return null;
  }

  return {
    sourceThreadId: `deepwiki:${owner}/${repo}`,
    owner,
    repo,
    route: routeParts.join("/") || "overview",
    fallbackTitle: `${owner}/${repo} DeepWiki`,
  };
}

export function isDeepWikiUrl(input: string | URL): boolean {
  const url = typeof input === "string" ? safeUrl(input) : input;
  return Boolean(url && DEEPWIKI_HOSTS.has(url.hostname));
}

export function isCapturableSourceUrl(input: string | URL): boolean {
  return isChatGptUrl(input) || parseDeepWikiPageIdentity(input) !== null;
}

export function isChatGptConversationUrl(input: string | URL): boolean {
  return parseChatGptConversationId(input) !== null;
}

function titleFromSlug(slug: string): string {
  return slug
    .replace(/_[0-9a-f-]{20,}$/i, "")
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function safeUrl(input: string): URL | null {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}
