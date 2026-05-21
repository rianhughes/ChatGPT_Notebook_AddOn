import browser from "./extensionApi";
import type { ExtensionMessage } from "../core/ports";
import type { ChatGptContext } from "../core/threadIdentity";
import { isChatGptUrl, parseChatGptConversationId } from "../core/threadIdentity";

const CHATGPT_MATCH_PATTERNS = ["https://chatgpt.com/*", "https://chat.openai.com/*"];

export async function getActiveChatGptContext(): Promise<ChatGptContext | null> {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];

  if (!tab?.url) {
    return null;
  }

  const sourceThreadId = parseChatGptConversationId(tab.url);

  if (!sourceThreadId) {
    return null;
  }

  return {
    sourceThreadId,
    title: tab.title || "Untitled ChatGPT conversation",
    url: tab.url,
  };
}

export async function broadcastToChatGptTabs(message: ExtensionMessage): Promise<void> {
  const tabs = await browser.tabs.query({ url: CHATGPT_MATCH_PATTERNS });

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
