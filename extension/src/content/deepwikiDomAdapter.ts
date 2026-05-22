import { contentHashFromParts, sourceMessageKeyFromParts } from "../core/hash";
import { parseDeepWikiPageIdentity } from "../core/threadIdentity";
import type { MessageCaptureAdapter, ExtractedSourceMessage } from "./sourceAdapter";
import {
  extractMarkdownFromNode,
  markdownToPlainText,
} from "./markdownExtraction";

const CONTENT_SELECTORS = [
  ".prose-custom",
  ".prose",
  "article",
  "[role='main']",
  "main",
];
const HEADING_SELECTOR = "h1, h2, h3, [data-header='true']";
const SEARCH_SECTION_HEADING_PATTERN = /^(read path|notes|answer|response|overview)$/i;
const OVERLAY_SELECTORS = ".cgpt-notes-capture, .cgpt-notes-selection-popover";
const SOURCE_REFERENCE_PATTERN = /^(?:[\w@.-]+\/)*[\w@.-]+\.[A-Za-z0-9]+:\d+(?:-\d+)?$/;

export const deepWikiCaptureAdapter: MessageCaptureAdapter = {
  source: "deepwiki",
  labels: {
    exportMessage: "Export to ChatGPT Note",
    exportSelection: "Export selected text to ChatGPT Notes",
  },
  getCurrentContext: getCurrentDeepWikiContext,
  findConversationRoot,
  findVisibleMessageContainers,
  extractMessageFromContainer,
  extractSelectionFromDocument,
};

export function getCurrentDeepWikiContext(): {
  source: "deepwiki";
  sourceThreadId: string;
  title: string;
  url: string;
} | null {
  const identity = parseDeepWikiPageIdentity(window.location.href);

  if (!identity) {
    return null;
  }

  return {
    source: "deepwiki",
    sourceThreadId: identity.sourceThreadId,
    title: getDeepWikiTitle(identity.fallbackTitle),
    url: window.location.href,
  };
}

export function findConversationRoot(): HTMLElement {
  return document.body;
}

export function findVisibleMessageContainers(root: ParentNode = document): HTMLElement[] {
  const contentRoot = findContentRoot(root);

  if (!contentRoot || !isVisibleEnough(contentRoot)) {
    return [];
  }

  const headings = Array.from(contentRoot.querySelectorAll<HTMLElement>(HEADING_SELECTOR))
    .filter((heading) => isVisibleEnough(heading) && Boolean(heading.textContent?.trim()))
    .filter((heading) => isLikelyContentHeading(heading, contentRoot))
    .filter((heading, index, headings) => headings.findIndex((candidate) => candidate === heading) === index);

  if (window.location.pathname.startsWith("/search/")) {
    return [contentRoot, ...headings.filter((heading) => heading !== contentRoot)];
  }

  if (headings.length > 0) {
    return headings;
  }

  return [contentRoot];
}

export function extractMessageFromContainer(container: HTMLElement): ExtractedSourceMessage | null {
  return buildExtractedMessage(container, extractSectionMarkdown(container), "message");
}

export function extractSelectionFromDocument(selection: Selection | null): ExtractedSourceMessage | null {
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const contentRoot = findSelectionContentRoot(range) ?? findContentRoot();

  if (!contentRoot || !contentRoot.contains(range.commonAncestorContainer)) {
    return null;
  }

  const container = findSectionContainerForNode(range.commonAncestorContainer, contentRoot) ?? contentRoot;

  if (!contentRoot.contains(range.startContainer) || !contentRoot.contains(range.endContainer)) {
    return null;
  }

  return buildExtractedMessage(container, extractSelectionMarkdown(range), "selection");
}

function buildExtractedMessage(
  container: HTMLElement,
  contentMarkdown: string,
  captureMode: "message" | "selection",
): ExtractedSourceMessage | null {
  const context = getCurrentDeepWikiContext();
  const contentText = markdownToPlainText(contentMarkdown);

  if (!context || !contentText) {
    return null;
  }

  const sourceMessageId = getSourceMessageId(container);
  const baseSourceMessageKey = sourceMessageKeyFromParts({
    sourceMessageId,
    role: "assistant",
    contentText,
  });
  const contentHash = contentHashFromParts({ contentMarkdown, contentText });
  const sourceMessageKey =
    captureMode === "selection" ? `selection:${baseSourceMessageKey}:${contentHash}` : baseSourceMessageKey;

  return {
    source: "deepwiki",
    container,
    sourceThreadId: context.sourceThreadId,
    title: context.title,
    sourceMessageId,
    sourceMessageKey,
    contentHash,
    role: "assistant",
    contentMarkdown,
    contentText,
    isStreaming: false,
  };
}

function findContentRoot(root: ParentNode = document): HTMLElement | null {
  const searchAnswerRoot = findSearchAnswerRoot(root);

  if (searchAnswerRoot) {
    return searchAnswerRoot;
  }

  let bestCandidate: HTMLElement | null = null;
  let bestScore = 0;

  for (const selector of CONTENT_SELECTORS) {
    const candidates = Array.from(root.querySelectorAll<HTMLElement>(selector));

    for (const candidate of candidates) {
      const score = scoreContentRootCandidate(candidate);

      if (score > bestScore) {
        bestCandidate = candidate;
        bestScore = score;
      }
    }
  }

  return bestCandidate ?? (hasMeaningfulText(document.body) ? document.body : null);
}

function findSearchAnswerRoot(root: ParentNode): HTMLElement | null {
  if (!window.location.pathname.startsWith("/search/")) {
    return null;
  }

  const headings = Array.from(root.querySelectorAll<HTMLElement>("h1, h2, h3"))
    .filter((heading) => isVisibleEnough(heading))
    .filter((heading) => SEARCH_SECTION_HEADING_PATTERN.test(getNormalizedElementText(heading)));

  if (headings.length === 0) {
    return null;
  }

  const firstHeading = headings[0];
  const contentAncestor = findReadableAncestor(firstHeading);

  if (contentAncestor) {
    return contentAncestor;
  }

  return firstHeading.parentElement;
}

function findReadableAncestor(element: HTMLElement): HTMLElement | null {
  let current = element.parentElement;

  while (current && current !== document.body) {
    const text = getNormalizedElementText(current);
    const hasReadableBlocks = current.querySelectorAll("p, li, pre, table, h1, h2, h3").length >= 2;
    const hasControls = current.querySelectorAll("textarea, input, button").length > 0;

    if (text.length > 80 && hasReadableBlocks && !hasControls) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

function scoreContentRootCandidate(element: HTMLElement): number {
  if (!isVisibleEnough(element) || !hasMeaningfulText(element)) {
    return 0;
  }

  const textLength = Math.min(getNormalizedElementText(element).length, 5000);
  const readableBlockCount = element.querySelectorAll("p, li, pre, table, h1, h2, h3").length;
  const formControlCount = element.querySelectorAll("textarea, input, button").length;
  const navigationPenalty = element.matches("nav, header, footer, aside") ? 2000 : 0;

  return textLength + readableBlockCount * 80 - formControlCount * 120 - navigationPenalty;
}

function isLikelyContentHeading(heading: HTMLElement, contentRoot: HTMLElement): boolean {
  if (contentRoot === document.body && heading.closest("nav, header, footer, aside")) {
    return false;
  }

  if (!window.location.pathname.startsWith("/search/")) {
    return true;
  }

  return SEARCH_SECTION_HEADING_PATTERN.test(getNormalizedElementText(heading));
}

function findSelectionContentRoot(range: Range): HTMLElement | null {
  const element = getElementForNode(range.commonAncestorContainer);
  let current: HTMLElement | null = element;

  while (current && current !== document.body) {
    if (isUsableSelectionRoot(current) && current.contains(range.startContainer) && current.contains(range.endContainer)) {
      return current;
    }

    current = current.parentElement;
  }

  return document.body.contains(range.startContainer) && document.body.contains(range.endContainer) ? document.body : null;
}

function isUsableSelectionRoot(element: HTMLElement): boolean {
  if (!isVisibleEnough(element) || !hasMeaningfulText(element)) {
    return false;
  }

  if (element.matches("script, style, textarea, input, button, form, nav, header, footer, aside")) {
    return false;
  }

  return true;
}

function findSectionContainerForNode(node: Node, contentRoot = findContentRoot()): HTMLElement | null {
  const element = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;

  if (!contentRoot || !element || !contentRoot.contains(element)) {
    return null;
  }

  const ownHeading = element.closest<HTMLElement>(HEADING_SELECTOR);

  if (ownHeading && contentRoot.contains(ownHeading)) {
    return ownHeading;
  }

  let current: Element | null = element;

  while (current && current !== contentRoot) {
    let sibling = current.previousElementSibling;

    while (sibling) {
      if (sibling instanceof HTMLElement && matchesHeading(sibling)) {
        return sibling;
      }

      const nestedHeadings = Array.from(sibling.querySelectorAll<HTMLElement>(HEADING_SELECTOR));
      const nestedHeading = nestedHeadings.reverse().find((heading) => isVisibleEnough(heading));

      if (nestedHeading) {
        return nestedHeading;
      }

      sibling = sibling.previousElementSibling;
    }

    current = current.parentElement;
  }

  return null;
}

function extractSectionMarkdown(container: HTMLElement): string {
  const fragment = document.createDocumentFragment();

  if (matchesHeading(container)) {
    collectHeadingSection(container).forEach((node) => {
      fragment.append(node.cloneNode(true));
    });
  } else {
    fragment.append(container.cloneNode(true));
  }

  fragment.querySelectorAll?.(OVERLAY_SELECTORS).forEach((element) => element.remove());
  moveDeepWikiSourceReferencesOutOfProse(fragment);
  return cleanDeepWikiMarkdown(extractMarkdownFromNode(fragment));
}

function extractSelectionMarkdown(range: Range): string {
  const fragment = range.cloneContents();

  moveDeepWikiSourceReferencesOutOfProse(fragment);
  return cleanDeepWikiMarkdown(extractMarkdownFromNode(fragment));
}

function moveDeepWikiSourceReferencesOutOfProse(root: ParentNode): void {
  root.querySelectorAll?.("p, li").forEach((block) => {
    if (!(block instanceof HTMLElement)) {
      return;
    }

    const references: string[] = [];

    block.querySelectorAll("a").forEach((link) => {
      const label = getNormalizedElementText(link);

      if (!SOURCE_REFERENCE_PATTERN.test(label)) {
        return;
      }

      references.push(label);
      link.remove();
    });

    if (references.length === 0) {
      return;
    }

    appendSourceReferenceBlock(block, references);
  });
}

function appendSourceReferenceBlock(block: HTMLElement, references: string[]): void {
  const sources = document.createElement(block.tagName === "LI" ? "div" : "p");
  const label = document.createElement("strong");
  const uniqueReferences = [...new Set(references)];

  label.textContent = "Sources:";
  sources.append(label, document.createTextNode(` ${uniqueReferences.join(", ")}`));

  if (block.tagName === "LI") {
    block.append(sources);
    return;
  }

  block.after(sources);
}

function cleanDeepWikiMarkdown(markdown: string): string {
  return markdown
    .split(/(```[\s\S]*?```)/g)
    .map((part) => (part.startsWith("```") ? part : cleanDeepWikiMarkdownText(part)))
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanDeepWikiMarkdownText(markdown: string): string {
  return markdown
    .replace(/[ \t]*\n[ \t]*([.,;:!?])/g, "$1")
    .replace(/([^\n])\n(?!\n|#{1,6}\s|- |\d+\. |> |\|)/g, "$1 ")
    .replace(/(\S)[ \t]{2,}(\S)/g, "$1 $2")
    .replace(/[ \t]+([.,;:!?])/g, "$1");
}

function collectHeadingSection(heading: HTMLElement): HTMLElement[] {
  const level = getHeadingLevel(heading);
  const nodes: HTMLElement[] = [heading];
  let sibling = heading.nextElementSibling;

  while (sibling instanceof HTMLElement) {
    if (matchesHeading(sibling) && getHeadingLevel(sibling) <= level) {
      break;
    }

    nodes.push(sibling);
    sibling = sibling.nextElementSibling;
  }

  return nodes;
}

function getSourceMessageId(container: HTMLElement): string | null {
  const identity = parseDeepWikiPageIdentity(window.location.href);

  if (!identity) {
    return null;
  }

  const route = identity.route || "overview";
  const headingId = getHeadingId(container);
  return headingId ? `${identity.sourceThreadId}:${route}#${headingId}` : `${identity.sourceThreadId}:${route}`;
}

function getHeadingId(container: HTMLElement): string | null {
  const rawId = container.id || container.textContent;
  const value = rawId?.trim();

  if (!value || value === "true") {
    return null;
  }

  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function getDeepWikiTitle(fallbackTitle: string): string {
  const heading = findContentRoot()?.querySelector<HTMLElement>("h1, h2");
  const headingText = heading?.textContent?.trim();
  const documentTitle = document.title.replace(/\s*\|\s*DeepWiki\s*$/i, "").trim();

  return headingText || documentTitle || fallbackTitle;
}

function matchesHeading(element: Element): boolean {
  return element.matches(HEADING_SELECTOR);
}

function getHeadingLevel(element: HTMLElement): number {
  if (/^H[1-6]$/.test(element.tagName)) {
    return Number(element.tagName.slice(1));
  }

  return 2;
}

function hasMeaningfulText(element: HTMLElement): boolean {
  return Boolean(getNormalizedElementText(element));
}

function getElementForNode(node: Node): HTMLElement | null {
  if (node instanceof HTMLElement) {
    return node;
  }

  return node.parentElement;
}

function getNormalizedElementText(element: HTMLElement): string {
  return element.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

function isVisibleEnough(element: HTMLElement): boolean {
  if (element.closest("[hidden], [aria-hidden='true']")) {
    return false;
  }

  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden";
}
