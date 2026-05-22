import browser from "./extensionApi";
import type { ExtensionMessage } from "../core/ports";
import type { ChatGptContext } from "../core/threadIdentity";
import {
  isCapturableSourceUrl,
  isChatGptUrl,
  parseChatGptConversationId,
  parseDeepWikiPageIdentity,
} from "../core/threadIdentity";

const CHATGPT_MATCH_PATTERNS = ["https://chatgpt.com/*", "https://chat.openai.com/*"];
const CAPTURABLE_MATCH_PATTERNS = [...CHATGPT_MATCH_PATTERNS, "https://deepwiki.com/*"];

type ScriptableTab = {
  id?: number;
  url?: string;
};

type ScriptingApi = {
  executeScript?: (details: { target: { tabId: number }; files: string[] }) => Promise<unknown>;
  insertCSS?: (details: { target: { tabId: number }; files: string[] }) => Promise<unknown>;
};

export async function getActiveChatGptContext(): Promise<ChatGptContext | null> {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];

  if (!tab?.url) {
    return null;
  }

  const sourceThreadId = parseChatGptConversationId(tab.url);

  if (sourceThreadId) {
    return {
      source: "chatgpt",
      sourceThreadId,
      title: tab.title || "Untitled ChatGPT conversation",
      url: tab.url,
    };
  }

  const deepWikiIdentity = parseDeepWikiPageIdentity(tab.url);

  if (!deepWikiIdentity) {
    return null;
  }

  return {
    source: "deepwiki",
    sourceThreadId: deepWikiIdentity.sourceThreadId,
    title: tab.title?.replace(/\s*\|\s*DeepWiki\s*$/i, "").trim() || deepWikiIdentity.fallbackTitle,
    url: tab.url,
  };
}

export async function ensureActiveCapturableContentScript(): Promise<void> {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];

  if (!tab) {
    return;
  }

  await ensureChatGptContentScript(tab);
}

export async function broadcastToChatGptTabs(message: ExtensionMessage): Promise<void> {
  const tabs = await browser.tabs.query({ url: CAPTURABLE_MATCH_PATTERNS });

  await Promise.all(
    tabs.map(async (tab) => {
      if (!tab.id) {
        return;
      }

      try {
        await browser.tabs.sendMessage(tab.id, message);
      } catch {
        // The tab may match by URL before the content script is ready.
      }
    }),
  );
}

export async function sendMessageToActiveChatGptTab<TResponse>(
  message: ExtensionMessage,
): Promise<TResponse | null> {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];

  if (!tab?.id || !tab.url || !isChatGptUrl(tab.url)) {
    return null;
  }

  try {
    return (await browser.tabs.sendMessage(tab.id, message)) as TResponse;
  } catch {
    return null;
  }
}

export async function ensureChatGptContentScript(tab: ScriptableTab): Promise<void> {
  if (!tab.id || !tab.url || !isCapturableSourceUrl(tab.url)) {
    return;
  }

  const scripting = (browser as unknown as { scripting?: ScriptingApi }).scripting;

  if (!scripting?.executeScript) {
    return;
  }

  try {
    await scripting.insertCSS?.({
      target: { tabId: tab.id },
      files: ["injected.css"],
    });
  } catch {
    // The declared content script may already have inserted the stylesheet.
  }

  await scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"],
  });
}
