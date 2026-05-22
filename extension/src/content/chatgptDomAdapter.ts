import { contentHashFromParts, sourceMessageKeyFromParts } from "../core/hash";
import type { MessageRole, SaveChatGptMessageInput } from "../core/models";
import { isChatGptUrl, parseChatGptConversationId } from "../core/threadIdentity";
import type { MessageCaptureAdapter } from "./sourceAdapter";
import {
  extractMarkdownFromNode,
  extractMarkdownFromRange,
  markdownToPlainText,
} from "./markdownExtraction";

const MESSAGE_CONTAINER_SELECTORS = [
  "[data-message-author-role]",
  "[data-testid^='conversation-turn-']",
];

const TEMPORARY_THREAD_STORAGE_KEY = "chatgpt-notes-temporary-thread-id";
const ROLE_VALUES = new Set<MessageRole>(["assistant", "user", "system"]);

export type ChatGptExtractedMessage = SaveChatGptMessageInput & {
  container: HTMLElement;
  isStreaming: boolean;
};

export function getCurrentChatGptConversation(): {
  source: "chatgpt";
  sourceThreadId: string;
  title: string;
  url: string;
} | null {
  const sourceThreadId = parseChatGptConversationId(window.location.href) ?? getTemporaryChatGptThreadId();

  if (!sourceThreadId) {
    return null;
  }

  return {
    source: "chatgpt",
    sourceThreadId,
    title: document.title.replace(/\s*-\s*ChatGPT\s*$/i, "").trim() || "ChatGPT conversation",
    url: window.location.href,
  };
}

function getTemporaryChatGptThreadId(): string | null {
  if (!isChatGptUrl(window.location.href)) {
    return null;
  }

  try {
    const existing = window.sessionStorage.getItem(TEMPORARY_THREAD_STORAGE_KEY);

    if (existing) {
      return existing;
    }

    const next = `temporary:${globalThis.crypto?.randomUUID?.() ?? createTemporaryThreadSuffix()}`;
    window.sessionStorage.setItem(TEMPORARY_THREAD_STORAGE_KEY, next);
    return next;
  } catch {
    return `temporary:${createTemporaryThreadSuffix()}`;
  }
}

function createTemporaryThreadSuffix(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function findConversationRoot(): HTMLElement {
  return document.querySelector("main") ?? document.body;
}

export function findVisibleMessageContainers(root: ParentNode = document): HTMLElement[] {
  const containers = MESSAGE_CONTAINER_SELECTORS.flatMap((selector) =>
    Array.from(root.querySelectorAll<HTMLElement>(selector)),
  )
    .map(resolveMessageContainer)
    .filter((container): container is HTMLElement => Boolean(container));
  const uniqueContainers = [...new Set(containers)];

  return uniqueContainers.filter((container) => {
    if (!isVisibleEnough(container)) {
      return false;
    }

    return Boolean(getMessageRole(container));
  });
}

export function extractMessageFromContainer(container: HTMLElement): ChatGptExtractedMessage | null {
  return buildExtractedMessage(container, extractMessageMarkdown(container), "message");
}

export function extractSelectionFromDocument(selection: Selection | null): ChatGptExtractedMessage | null {
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const container = findMessageContainerForNode(range.commonAncestorContainer);

  if (!container || !container.contains(range.startContainer) || !container.contains(range.endContainer)) {
    return null;
  }

  const contentMarkdown = extractMarkdownFromRange(range);
  return buildExtractedMessage(container, contentMarkdown, "selection");
}

export function findMessageContainerForNode(node: Node): HTMLElement | null {
  const element = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  const selectors = MESSAGE_CONTAINER_SELECTORS.join(",");
  const container = resolveMessageContainer(element?.closest<HTMLElement>(selectors) ?? null);

  if (container && getMessageRole(container)) {
    return container;
  }

  const roleElement = element?.closest<HTMLElement>("[data-message-author-role]") ?? null;
  return roleElement && getMessageRole(roleElement) ? roleElement : null;
}

function resolveMessageContainer(container: HTMLElement | null): HTMLElement | null {
  if (!container) {
    return null;
  }

  if (getOwnMessageRole(container)) {
    return container;
  }

  return (
    Array.from(container.querySelectorAll<HTMLElement>("[data-message-author-role]")).find((element) =>
      Boolean(getOwnMessageRole(element)),
    ) ?? null
  );
}

function buildExtractedMessage(
  container: HTMLElement,
  contentMarkdown: string,
  captureMode: "message" | "selection",
): ChatGptExtractedMessage | null {
  const context = getCurrentChatGptConversation();
  const role = getMessageRole(container);

  if (!context || !role) {
    return null;
  }

  const sourceMessageId = getSourceMessageId(container);
  const contentText = markdownToPlainText(contentMarkdown);

  if (!contentText) {
    return null;
  }

  const baseSourceMessageKey = sourceMessageKeyFromParts({
    sourceMessageId,
    role,
    contentText,
  });
  const contentHash = contentHashFromParts({ contentMarkdown, contentText });
  const sourceMessageKey =
    captureMode === "selection" ? `selection:${baseSourceMessageKey}:${contentHash}` : baseSourceMessageKey;

  return {
    source: "chatgpt",
    container,
    sourceThreadId: context.sourceThreadId,
    title: context.title,
    sourceMessageId,
    sourceMessageKey,
    contentHash,
    role,
    contentMarkdown,
    contentText,
    isStreaming: isMessageStreaming(container),
  };
}

export const chatGptCaptureAdapter: MessageCaptureAdapter = {
  source: "chatgpt",
  labels: {
    exportMessage: "Export to ChatGPT Notebook",
    exportSelection: "Export selected text to ChatGPT Notebook",
  },
  supportsAiOperations: true,
  getCurrentContext: getCurrentChatGptConversation,
  findConversationRoot,
  findVisibleMessageContainers,
  extractMessageFromContainer,
  extractSelectionFromDocument,
};

function getMessageRole(container: HTMLElement): Extract<MessageRole, "assistant" | "user" | "system"> | null {
  const roleElement = container.matches("[data-message-author-role]")
    ? container
    : container.querySelector<HTMLElement>("[data-message-author-role]");
  return roleElement ? getOwnMessageRole(roleElement) : null;
}

function getOwnMessageRole(container: HTMLElement): Extract<MessageRole, "assistant" | "user" | "system"> | null {
  const role = container.getAttribute("data-message-author-role");
  if (role && ROLE_VALUES.has(role as MessageRole) && role !== "note") {
    return role as Extract<MessageRole, "assistant" | "user" | "system">;
  }

  return null;
}

function getSourceMessageId(container: HTMLElement): string | null {
  const idElement =
    findSelfOrDescendantWithAttribute(container, "data-message-id") ??
    findSelfOrDescendantWithAttribute(container, "data-turn-id") ??
    findSelfOrDescendantWithAttribute(container, "data-testid");
  const rawId =
    idElement?.getAttribute("data-message-id") ??
    idElement?.getAttribute("data-turn-id") ??
    idElement?.getAttribute("data-testid") ??
    container.id;

  return rawId || null;
}

function extractMessageMarkdown(container: HTMLElement): string {
  const clone = container.cloneNode(true) as HTMLElement;

  clone.querySelectorAll(".cgpt-notes-capture, .cgpt-notes-selection-popover").forEach((element) => {
    element.remove();
  });

  const preferredContent =
    clone.querySelector<HTMLElement>(".markdown") ??
    clone.querySelector<HTMLElement>("[data-message-author-role]") ??
    clone;

  return extractMarkdownFromNode(preferredContent);
}

function isMessageStreaming(container: HTMLElement): boolean {
  return Boolean(
    container.matches("[aria-busy='true'], .result-streaming") ||
      container.querySelector("[aria-busy='true'], .result-streaming, [data-testid*='streaming']"),
  );
}

function findSelfOrDescendantWithAttribute(container: HTMLElement, attributeName: string): HTMLElement | null {
  if (container.hasAttribute(attributeName)) {
    return container;
  }

  return container.querySelector<HTMLElement>(`[${attributeName}]`);
}

function isVisibleEnough(container: HTMLElement): boolean {
  const style = window.getComputedStyle(container);
  return style.display !== "none" && style.visibility !== "hidden";
}
