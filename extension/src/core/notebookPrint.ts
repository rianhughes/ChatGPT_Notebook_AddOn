import type { NotebookExportData, NotebookExportMessage } from "./notebookExport";

export function createNotebookPrintHtml(data: NotebookExportData): string {
  const title = escapeHtml(data.thread.title);
  const exportedAt = escapeHtml(data.exportedAt);
  const messageCount = data.messages.length;
  const messageLabel = messageCount === 1 ? "message" : "messages";

  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${title}</title>`,
    `<style>${PRINT_STYLES}</style>`,
    "</head>",
    "<body>",
    '<main class="notebook-print">',
    '<header class="notebook-print-header">',
    `<p class="notebook-print-meta">${messageCount} saved ${messageLabel} - Exported ${exportedAt}</p>`,
    `<h1>${title}</h1>`,
    "</header>",
    data.messages.length > 0
      ? `<section class="notebook-print-messages">${data.messages.map(formatPrintableMessage).join("\n")}</section>`
      : '<p class="notebook-print-empty">No saved notes.</p>',
    "</main>",
    "</body>",
    "</html>",
  ].join("\n");
}

function formatPrintableMessage(message: NotebookExportMessage): string {
  const role = escapeHtml(formatRole(message.role));
  const timestamp = toIsoString(message.createdAt);
  const markdown = message.contentMarkdown.trim() || message.contentText.trim();

  return [
    '<article class="notebook-print-message">',
    '<header class="notebook-print-message-header">',
    `<h2>${role}</h2>`,
    `<time datetime="${escapeHtml(timestamp)}">${escapeHtml(timestamp)}</time>`,
    "</header>",
    `<div class="notebook-print-content">${formatPrintableMarkdown(markdown)}</div>`,
    "</article>",
  ].join("\n");
}

function formatPrintableMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let paragraphLines: string[] = [];
  let list: { type: "ol" | "ul"; items: string[] } | null = null;
  let quoteLines: string[] = [];
  let codeLines: string[] = [];
  let codeLanguage = "";
  let inCodeBlock = false;

  const flushParagraph = () => {
    if (paragraphLines.length === 0) {
      return;
    }

    html.push(`<p>${renderInlineMarkdown(paragraphLines.join(" "))}</p>`);
    paragraphLines = [];
  };

  const flushList = () => {
    if (!list) {
      return;
    }

    const items = list.items.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join("");
    html.push(`<${list.type}>${items}</${list.type}>`);
    list = null;
  };

  const flushQuote = () => {
    if (quoteLines.length === 0) {
      return;
    }

    html.push(`<blockquote>${quoteLines.map((line) => `<p>${renderInlineMarkdown(line)}</p>`).join("")}</blockquote>`);
    quoteLines = [];
  };

  const flushFlow = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  const flushCodeBlock = () => {
    const languageClass = codeLanguage ? ` class="language-${escapeHtml(slugifyCssClassPart(codeLanguage))}"` : "";
    html.push(`<pre><code${languageClass}>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
    codeLines = [];
    codeLanguage = "";
    inCodeBlock = false;
  };

  for (const line of lines) {
    const fence = line.match(/^```([^\s`]*)\s*$/);

    if (inCodeBlock) {
      if (fence) {
        flushCodeBlock();
      } else {
        codeLines.push(line);
      }

      continue;
    }

    if (fence) {
      flushFlow();
      inCodeBlock = true;
      codeLanguage = fence[1] ?? "";
      continue;
    }

    if (!line.trim()) {
      flushFlow();
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushFlow();
      const level = Math.min(heading[1].length + 1, 6);
      html.push(`<h${level}>${renderInlineMarkdown(heading[2].trim())}</h${level}>`);
      continue;
    }

    const unordered = line.match(/^\s*[-*]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      const type = ordered ? "ol" : "ul";

      flushParagraph();
      flushQuote();

      if (list && list.type !== type) {
        flushList();
      }

      list = list ?? { type, items: [] };
      list.items.push((ordered?.[1] ?? unordered?.[1] ?? "").trim());
      continue;
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      flushParagraph();
      flushList();
      quoteLines.push(quote[1].trim());
      continue;
    }

    flushList();
    flushQuote();
    paragraphLines.push(line.trim());
  }

  if (inCodeBlock) {
    flushCodeBlock();
  }

  flushFlow();

  return html.join("\n") || '<p class="notebook-print-empty">Empty note.</p>';
}

function renderInlineMarkdown(value: string): string {
  const codeSegments: string[] = [];
  const html = escapeHtml(value).replace(/`([^`]+)`/g, (_match, code: string) => {
    const token = `@@NOTEPRINTCODE${codeSegments.length}@@`;
    codeSegments.push(`<code>${code}</code>`);
    return token;
  });

  return codeSegments.reduce(
    (rendered, code, index) => rendered.replaceAll(`@@NOTEPRINTCODE${index}@@`, code),
    html
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/_([^_\n]+)_/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>'),
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugifyCssClassPart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
}

function formatRole(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function toIsoString(value: number | Date): string {
  return new Date(value).toISOString();
}

const PRINT_STYLES = `
:root {
  color: #1f2933;
  background: #ffffff;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 16px;
}

body {
  margin: 0;
  background: #ffffff;
}

.notebook-print {
  max-width: 760px;
  margin: 0 auto;
  padding: 48px 36px 64px;
}

.notebook-print-header {
  margin-bottom: 32px;
  border-bottom: 1px solid #d7dee8;
  padding-bottom: 20px;
}

.notebook-print-meta {
  margin: 0 0 10px;
  color: #667085;
  font-size: 0.82rem;
}

h1 {
  margin: 0;
  color: #111827;
  font-size: 2rem;
  line-height: 1.15;
}

.notebook-print-messages {
  display: grid;
  gap: 28px;
}

.notebook-print-message {
  break-inside: avoid;
  page-break-inside: avoid;
}

.notebook-print-message-header {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  align-items: baseline;
  margin-bottom: 10px;
}

.notebook-print-message-header h2 {
  margin: 0;
  color: #111827;
  font-size: 1rem;
}

.notebook-print-message-header time {
  color: #667085;
  font-size: 0.78rem;
}

.notebook-print-content {
  color: #243447;
  line-height: 1.55;
}

.notebook-print-content h2,
.notebook-print-content h3,
.notebook-print-content h4,
.notebook-print-content h5,
.notebook-print-content h6 {
  margin: 1.2em 0 0.45em;
  color: #111827;
  line-height: 1.25;
}

.notebook-print-content h2 {
  font-size: 1.35rem;
}

.notebook-print-content h3 {
  font-size: 1.18rem;
}

.notebook-print-content h4,
.notebook-print-content h5,
.notebook-print-content h6 {
  font-size: 1rem;
}

.notebook-print-content p,
.notebook-print-content ul,
.notebook-print-content ol,
.notebook-print-content blockquote,
.notebook-print-content pre {
  margin: 0 0 0.9em;
}

.notebook-print-content ul,
.notebook-print-content ol {
  padding-left: 1.35em;
}

.notebook-print-content blockquote {
  border-left: 3px solid #9aa8bb;
  padding-left: 1em;
  color: #475467;
}

.notebook-print-content code {
  border-radius: 4px;
  background: #eef2f7;
  padding: 0.08em 0.28em;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 0.92em;
}

.notebook-print-content pre {
  overflow-x: auto;
  border: 1px solid #d7dee8;
  border-radius: 6px;
  background: #f6f8fb;
  padding: 12px;
  white-space: pre-wrap;
}

.notebook-print-content pre code {
  display: block;
  background: transparent;
  padding: 0;
}

.notebook-print-content a {
  color: #175cd3;
  text-decoration: underline;
}

.notebook-print-empty {
  color: #667085;
}

@media print {
  .notebook-print {
    max-width: none;
    padding: 0;
  }
}
`;
