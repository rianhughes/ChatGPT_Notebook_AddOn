import { markdownToPlainText } from "../core/markdown";

const BLOCK_TAGS = new Set([
  "ADDRESS",
  "ARTICLE",
  "ASIDE",
  "BLOCKQUOTE",
  "DIV",
  "FIGCAPTION",
  "FIGURE",
  "FOOTER",
  "FORM",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "HEADER",
  "LI",
  "MAIN",
  "NAV",
  "OL",
  "P",
  "PRE",
  "SECTION",
  "TABLE",
  "UL",
]);

export function extractMarkdownFromNode(node: Node): string {
  return normalizeMarkdown(renderNode(node, { inPre: false, listDepth: 0 }));
}

export function extractMarkdownFromRange(range: Range): string {
  const preElement = getSharedAncestor(range, "pre");

  if (preElement) {
    return codeFence(extractPreformattedText(range.cloneContents()), getCodeLanguage(preElement));
  }

  const codeElement = getSharedAncestor(range, "code");

  if (codeElement) {
    return inlineCode(range.toString());
  }

  return extractMarkdownFromNode(range.cloneContents());
}

export { markdownToPlainText };

function renderNode(node: Node, context: { inPre: boolean; listDepth: number }): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }

  if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    return renderChildren(node, context);
  }

  if (!(node instanceof HTMLElement)) {
    return "";
  }

  if (node.classList.contains("cgpt-notes-capture") || node.classList.contains("cgpt-notes-selection-popover")) {
    return "";
  }

  const tagName = node.tagName;

  switch (tagName) {
    case "BR":
      return "\n";
    case "PRE": {
      const code = node.querySelector("code");
      const text = extractPreformattedText(code ?? node);
      return `\n\n${codeFence(text, getCodeLanguage(node))}\n\n`;
    }
    case "CODE":
      if (context.inPre) {
        return node.textContent ?? "";
      }

      return inlineCode(node.textContent ?? "");
    case "H1":
    case "H2":
    case "H3":
    case "H4":
    case "H5":
    case "H6": {
      const level = Number(tagName.slice(1));
      return `\n\n${"#".repeat(level)} ${renderChildren(node, context).trim()}\n\n`;
    }
    case "BLOCKQUOTE":
      return renderChildren(node, context)
        .trim()
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
    case "UL":
    case "OL":
      return `\n${renderChildren(node, { ...context, listDepth: context.listDepth + 1 })}\n`;
    case "LI": {
      const indent = "  ".repeat(Math.max(0, context.listDepth - 1));
      return `${indent}- ${renderChildren(node, context).trim()}\n`;
    }
    case "STRONG":
    case "B":
      return `**${renderChildren(node, context).trim()}**`;
    case "EM":
    case "I":
      return `_${renderChildren(node, context).trim()}_`;
    case "A": {
      const text = renderChildren(node, context).trim();
      const href = node.getAttribute("href");
      return href && text ? `[${text}](${href})` : text;
    }
    default: {
      const rendered = renderChildren(node, { ...context, inPre: context.inPre || tagName === "PRE" });

      if (BLOCK_TAGS.has(tagName)) {
        return `\n${rendered.trim()}\n`;
      }

      return rendered;
    }
  }
}

function renderChildren(node: Node, context: { inPre: boolean; listDepth: number }): string {
  return Array.from(node.childNodes)
    .map((child) => renderNode(child, context))
    .join("");
}

function normalizeMarkdown(markdown: string): string {
  return markdown
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function codeFence(code: string, language: string | null): string {
  const fence = "```";
  return `${fence}${language ?? ""}\n${code.replace(/\n+$/, "")}\n${fence}`;
}

function extractPreformattedText(node: Node): string {
  let text = "";

  function append(value: string) {
    text += value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  }

  function appendNewline() {
    if (!text.endsWith("\n")) {
      text += "\n";
    }
  }

  function walk(current: Node) {
    if (current.nodeType === Node.TEXT_NODE) {
      append(current.textContent ?? "");
      return;
    }

    if (current.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      Array.from(current.childNodes).forEach(walk);
      return;
    }

    if (!(current instanceof HTMLElement)) {
      return;
    }

    if (
      current.classList.contains("cgpt-notes-capture") ||
      current.classList.contains("cgpt-notes-selection-popover")
    ) {
      return;
    }

    if (current.tagName === "BR") {
      appendNewline();
      return;
    }

    const isLineElement = current !== node && isPreformattedLineElement(current);

    if (isLineElement && text) {
      appendNewline();
    }

    Array.from(current.childNodes).forEach(walk);

    if (isLineElement) {
      appendNewline();
    }
  }

  walk(node);
  return text.replace(/\n+$/, "");
}

function inlineCode(code: string): string {
  const trimmed = code.replace(/\s+/g, " ").trim();

  if (!trimmed) {
    return "";
  }

  return `\`${trimmed.replace(/`/g, "\\`")}\``;
}

function getSharedAncestor(range: Range, selector: string): HTMLElement | null {
  const start = getClosestElement(range.startContainer, selector);
  const end = getClosestElement(range.endContainer, selector);

  if (start && start === end) {
    return start;
  }

  return null;
}

function getClosestElement(node: Node, selector: string): HTMLElement | null {
  const element = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  return element?.closest<HTMLElement>(selector) ?? null;
}

function getCodeLanguage(element: HTMLElement): string | null {
  const code = element.matches("code") ? element : element.querySelector("code");
  const languageClass = Array.from(code?.classList ?? []).find((className) =>
    className.startsWith("language-"),
  );

  return (
    element.getAttribute("data-language") ??
    code?.getAttribute("data-language") ??
    languageClass?.replace(/^language-/, "") ??
    null
  );
}

function isPreformattedLineElement(element: HTMLElement): boolean {
  return BLOCK_TAGS.has(element.tagName) && element.tagName !== "PRE";
}
