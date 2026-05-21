import { ChevronDown, Copy, SendHorizontal, Trash2 } from "lucide-react";
import { Fragment, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";

import { copyText } from "../../core/clipboard";

type MarkdownPart =
  | { type: "code"; language: string | null; content: string }
  | { type: "text"; content: string };

type MarkdownBlock =
  | { type: "code"; key: string; language: string | null; content: string }
  | { type: "heading"; key: string; level: number; styleLevel: number; headingIndex: number; content: string }
  | { type: "list"; key: string; items: string[] }
  | { type: "paragraph"; key: string; content: string };

type MarkdownContentProps = {
  markdown: string;
  collapseAllHeadings?: boolean;
  onInsertSection?(headingIndex: number): void;
  onDeleteSection?(headingIndex: number): void;
};

export function MarkdownContent({
  markdown,
  collapseAllHeadings = false,
  onInsertSection,
  onDeleteSection,
}: MarkdownContentProps) {
  const blocks = useMemo(() => parseMarkdownBlocks(markdown), [markdown]);
  const [collapsedHeadingKeys, setCollapsedHeadingKeys] = useState<Set<string>>(() => new Set());
  const collapseAllHeadingsAppliedRef = useRef(false);

  useEffect(() => {
    if (!collapseAllHeadings) {
      collapseAllHeadingsAppliedRef.current = false;
      setCollapsedHeadingKeys(new Set());
      return;
    }

    const collapsibleHeadingKeys = getCollapsibleHeadingKeys(blocks);

    if (!collapseAllHeadingsAppliedRef.current) {
      collapseAllHeadingsAppliedRef.current = true;
      setCollapsedHeadingKeys(new Set(collapsibleHeadingKeys));
      return;
    }

    const validHeadingKeys = new Set(collapsibleHeadingKeys);
    setCollapsedHeadingKeys((current) => {
      const next = new Set<string>();
      let changed = false;

      current.forEach((key) => {
        if (validHeadingKeys.has(key)) {
          next.add(key);
        } else {
          changed = true;
        }
      });

      return changed ? next : current;
    });
  }, [blocks, collapseAllHeadings]);

  function toggleHeading(key: string) {
    setCollapsedHeadingKeys((current) => {
      const next = new Set(current);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  }

  return (
    <div className="rendered-message">
      {renderMarkdownBlocks(blocks, collapsedHeadingKeys, toggleHeading, onInsertSection, onDeleteSection)}
    </div>
  );
}

function getCollapsibleHeadingKeys(blocks: MarkdownBlock[]): string[] {
  return blocks
    .map((block, index) => (block.type === "heading" && hasCollapsibleSection(blocks, index) ? block.key : null))
    .filter((key): key is string => Boolean(key));
}

function renderMarkdownBlocks(
  blocks: MarkdownBlock[],
  collapsedHeadingKeys: Set<string>,
  onToggleHeading: (key: string) => void,
  onInsertSection?: (headingIndex: number) => void,
  onDeleteSection?: (headingIndex: number) => void,
) {
  const renderedBlocks: ReactNode[] = [];
  const collapsedSectionLevels: number[] = [];

  blocks.forEach((block, index) => {
    if (block.type === "heading") {
      for (let levelIndex = collapsedSectionLevels.length - 1; levelIndex >= 0; levelIndex -= 1) {
        if (collapsedSectionLevels[levelIndex] >= block.level) {
          collapsedSectionLevels.splice(levelIndex, 1);
        }
      }

      if (collapsedSectionLevels.length > 0) {
        return;
      }

      const isCollapsed = collapsedHeadingKeys.has(block.key);

      renderedBlocks.push(
        renderMarkdownBlock(block, {
          canCollapse: hasCollapsibleSection(blocks, index),
          isCollapsed,
          onToggleHeading,
          onInsertSection,
          onDeleteSection,
        }),
      );

      if (isCollapsed) {
        collapsedSectionLevels.push(block.level);
      }

      return;
    }

    if (collapsedSectionLevels.length === 0) {
      renderedBlocks.push(renderMarkdownBlock(block));
    }
  });

  return renderedBlocks;
}

function renderMarkdownBlock(
  block: MarkdownBlock,
  headingOptions?: {
    canCollapse: boolean;
    isCollapsed: boolean;
    onToggleHeading: (key: string) => void;
    onInsertSection?: (headingIndex: number) => void;
    onDeleteSection?: (headingIndex: number) => void;
  },
) {
  if (block.type === "code") {
    return <CodeBlock language={block.language} content={block.content} key={block.key} />;
  }

  if (block.type === "heading") {
    const className = `markdown-heading markdown-heading-level-${block.styleLevel}${
      headingOptions?.isCollapsed ? " is-collapsed" : ""
    }`;

    if (!headingOptions?.canCollapse) {
      return (
        <Fragment key={block.key}>
          <span className="markdown-heading-anchor" aria-hidden="true" />
          <h3 className={className} onClick={handleFloatingHeadingClick}>
            <span className="markdown-heading-row">
              <span className="markdown-heading-text">{renderInlineMarkdown(block.content)}</span>
              {headingOptions?.onDeleteSection ? (
                <button
                  className="markdown-heading-action-button markdown-heading-delete-button"
                  type="button"
                  title="Delete section"
                  aria-label="Delete section"
                  onClick={() => headingOptions.onDeleteSection?.(block.headingIndex)}
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              ) : null}
              {headingOptions?.onInsertSection ? (
                <button
                  className="markdown-heading-action-button markdown-heading-insert-button"
                  type="button"
                  title="Insert section into ChatGPT"
                  aria-label="Insert section into ChatGPT"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => headingOptions.onInsertSection?.(block.headingIndex)}
                >
                  <SendHorizontal size={15} aria-hidden="true" />
                </button>
              ) : null}
            </span>
          </h3>
        </Fragment>
      );
    }

    return (
      <Fragment key={block.key}>
        <span className="markdown-heading-anchor" aria-hidden="true" />
        <h3 className={className} onClickCapture={handleFloatingHeadingClick}>
          <span className="markdown-heading-row">
            <button
              className="markdown-heading-button"
              type="button"
              aria-expanded={!headingOptions.isCollapsed}
              title={headingOptions.isCollapsed ? "Expand section" : "Collapse section"}
              onClick={() => headingOptions.onToggleHeading(block.key)}
            >
              <ChevronDown className="markdown-heading-icon" size={16} aria-hidden="true" />
              <span className="markdown-heading-text">{renderInlineMarkdown(block.content)}</span>
            </button>
            {headingOptions.onDeleteSection ? (
              <button
                className="markdown-heading-action-button markdown-heading-delete-button"
                type="button"
                title="Delete section"
                aria-label="Delete section"
                onClick={() => headingOptions.onDeleteSection?.(block.headingIndex)}
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            ) : null}
            {headingOptions.onInsertSection ? (
              <button
                className="markdown-heading-action-button markdown-heading-insert-button"
                type="button"
                title="Insert section into ChatGPT"
                aria-label="Insert section into ChatGPT"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => headingOptions.onInsertSection?.(block.headingIndex)}
              >
                <SendHorizontal size={15} aria-hidden="true" />
              </button>
            ) : null}
          </span>
        </h3>
      </Fragment>
    );
  }

  if (block.type === "list") {
    return (
      <ul className="markdown-list" key={block.key}>
        {block.items.map((item, itemIndex) => (
          <li key={itemIndex}>{renderInlineMarkdown(item)}</li>
        ))}
      </ul>
    );
  }

  return (
    <p className="markdown-paragraph" key={block.key}>
      {renderInlineMarkdown(block.content)}
    </p>
  );
}

function CodeBlock({ language, content }: { language: string | null; content: string }) {
  const normalizedLanguage = normalizeLanguage(language, content);
  const formattedContent = formatCodeContent(normalizedLanguage, content);

  return (
    <figure className="markdown-code-card">
      <figcaption className="markdown-code-header">
        <span>{getLanguageLabel(normalizedLanguage)}</span>
        <button
          className="markdown-code-copy-button"
          type="button"
          title="Copy code"
          aria-label="Copy code"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => void copyText(formattedContent)}
        >
          <Copy size={15} aria-hidden="true" />
        </button>
      </figcaption>
      <pre className={`markdown-code-block language-${normalizedLanguage}`}>
        <code>{renderHighlightedCode(formattedContent, normalizedLanguage)}</code>
      </pre>
    </figure>
  );
}

function handleFloatingHeadingClick(event: MouseEvent<HTMLElement>) {
  const target = event.target;

  if (target instanceof Element && target.closest(".markdown-heading-action-button")) {
    return;
  }

  if (!jumpFloatingHeadingToStart(event.currentTarget)) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
}

function jumpFloatingHeadingToStart(heading: HTMLElement): boolean {
  const anchor = heading.previousElementSibling;

  if (!(anchor instanceof HTMLElement) || !anchor.classList.contains("markdown-heading-anchor")) {
    return false;
  }

  if (!isFloatingStickyHeading(heading, anchor)) {
    return false;
  }

  jumpElementToStickyStart(anchor, heading);
  return true;
}

function isFloatingStickyHeading(heading: HTMLElement, anchor: HTMLElement): boolean {
  const stickyTop = getStickyTop(heading);
  const headingTop = heading.getBoundingClientRect().top;
  const anchorTop = anchor.getBoundingClientRect().top;

  return headingTop <= stickyTop + 1 && anchorTop < headingTop - 1;
}

function jumpElementToStickyStart(anchor: HTMLElement, heading: HTMLElement) {
  const scrollParent = getScrollParent(heading);
  const stickyTop = getStickyTop(heading);
  const anchorTop = anchor.getBoundingClientRect().top;

  if (!scrollParent || scrollParent === document.documentElement || scrollParent === document.body) {
    window.scrollTo({ top: window.scrollY + anchorTop - stickyTop, behavior: "auto" });
    return;
  }

  const scrollParentTop = scrollParent.getBoundingClientRect().top;
  scrollParent.scrollTo({ top: scrollParent.scrollTop + anchorTop - scrollParentTop - stickyTop, behavior: "auto" });
}

function getScrollParent(element: HTMLElement): HTMLElement | null {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    const overflowY = window.getComputedStyle(parent).overflowY;

    if (/(auto|scroll|overlay)/.test(overflowY) && parent.scrollHeight > parent.clientHeight) {
      return parent;
    }
  }

  return document.scrollingElement instanceof HTMLElement ? document.scrollingElement : document.documentElement;
}

function getStickyTop(element: HTMLElement): number {
  const top = window.getComputedStyle(element).top;
  const parsedTop = Number.parseFloat(top);

  return Number.isFinite(parsedTop) ? parsedTop : 0;
}

function splitMarkdown(markdown: string): MarkdownPart[] {
  const parts: MarkdownPart[] = [];
  const codeBlockPattern = /```([^\n`]*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockPattern.exec(markdown)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: markdown.slice(lastIndex, match.index) });
    }

    parts.push({
      type: "code",
      language: match[1]?.trim() || null,
      content: match[2]?.replace(/\n$/, "") ?? "",
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < markdown.length) {
    parts.push({ type: "text", content: markdown.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", content: markdown }];
}

function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  let headingIndex = 0;
  const blocks: MarkdownBlock[] = splitMarkdown(markdown).flatMap((part, partIndex): MarkdownBlock[] => {
    if (part.type === "code") {
      return [{ type: "code", key: `code-${partIndex}`, language: part.language, content: part.content }];
    }

    return parseTextBlocks(part.content, `text-${partIndex}`);
  });

  return blocks.map((block) => {
    if (block.type !== "heading") {
      return block;
    }

    const indexedBlock = { ...block, headingIndex };
    headingIndex += 1;
    return indexedBlock;
  });
}

function parseTextBlocks(content: string, keyPrefix: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const paragraphLines: string[] = [];
  const listItems: string[] = [];
  let blockIndex = 0;

  function nextKey(type: string) {
    const key = `${keyPrefix}-${type}-${blockIndex}`;
    blockIndex += 1;
    return key;
  }

  function flushParagraph() {
    const paragraph = paragraphLines.join("\n").trim();

    if (paragraph) {
      blocks.push({ type: "paragraph", key: nextKey("paragraph"), content: paragraph });
    }

    paragraphLines.length = 0;
  }

  function flushList() {
    if (listItems.length > 0) {
      blocks.push({ type: "list", key: nextKey("list"), items: [...listItems] });
      listItems.length = 0;
    }
  }

  content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .forEach((rawLine) => {
      const line = rawLine.replace(/[ \t]+$/, "");

      if (!line.trim()) {
        flushParagraph();
        flushList();
        return;
      }

      const heading = line.match(/^ {0,3}(#{1,6})\s+(.+?)\s*$/);

      if (heading) {
        flushParagraph();
        flushList();

        const level = heading[1].length;
        blocks.push({
          type: "heading",
          key: nextKey("heading"),
          level,
          styleLevel: Math.min(level, 4),
          headingIndex: -1,
          content: heading[2],
        });
        return;
      }

      const listItem = line.match(/^\s*[-*]\s+(.+)$/);

      if (listItem) {
        flushParagraph();
        listItems.push(listItem[1].trim());
        return;
      }

      flushList();
      paragraphLines.push(line.trim());
    });

  flushParagraph();
  flushList();

  return blocks;
}

function hasCollapsibleSection(blocks: MarkdownBlock[], headingIndex: number): boolean {
  const heading = blocks[headingIndex];

  if (heading?.type !== "heading") {
    return false;
  }

  for (let index = headingIndex + 1; index < blocks.length; index += 1) {
    const block = blocks[index];

    if (block.type === "heading" && block.level <= heading.level) {
      return false;
    }

    return true;
  }

  return false;
}

function renderInlineMarkdown(text: string) {
  const segments = text.split(/(`[^`]+`)/g).filter(Boolean);

  return segments.map((segment, index) => {
    if (segment.startsWith("`") && segment.endsWith("`")) {
      return (
        <code className="markdown-inline-code" key={index}>
          {segment.slice(1, -1)}
        </code>
      );
    }

    return <span key={index}>{renderStrongText(segment, index)}</span>;
  });
}

function renderStrongText(text: string, segmentIndex: number) {
  const segments = text.split(/(\*\*[^*\n]+\*\*)/g).filter(Boolean);

  return segments.map((segment, index) => {
    if (segment.startsWith("**") && segment.endsWith("**")) {
      return <strong key={`${segmentIndex}-strong-${index}`}>{segment.slice(2, -2)}</strong>;
    }

    return <span key={`${segmentIndex}-text-${index}`}>{segment}</span>;
  });
}

function normalizeLanguage(language: string | null, content: string): string {
  const normalized = language?.trim().toLowerCase().split(/\s+/)[0] ?? "";

  if (normalized) {
    return normalized;
  }

  const trimmed = content.trim();

  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    return "json";
  }

  return "text";
}

function getLanguageLabel(language: string): string {
  const labels: Record<string, string> = {
    js: "JavaScript",
    javascript: "JavaScript",
    json: "JSON",
    jsx: "JSX",
    md: "Markdown",
    py: "Python",
    python: "Python",
    sh: "Shell",
    shell: "Shell",
    ts: "TypeScript",
    tsx: "TSX",
    typescript: "TypeScript",
  };

  return labels[language] ?? "Code";
}

function formatCodeContent(language: string, content: string): string {
  if (language !== "json") {
    return content;
  }

  try {
    return JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    return content;
  }
}

function renderHighlightedCode(content: string, language: string): ReactNode[] {
  if (language === "json") {
    return highlightJson(content);
  }

  return highlightGenericCode(content);
}

function highlightJson(content: string): ReactNode[] {
  const tokenPattern = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}\[\],:]/g;

  return tokenizeCode(content, tokenPattern, (match) => {
    if (match[1]) {
      if (match[2]) {
        return [
          <span className="syntax-token syntax-key" key="key">
            {match[1]}
          </span>,
          <span className="syntax-token syntax-punctuation" key="colon">
            {match[2]}
          </span>,
        ];
      }

      return (
        <span className="syntax-token syntax-string" key="string">
          {match[1]}
        </span>
      );
    }

    if (match[3]) {
      return (
        <span className="syntax-token syntax-literal" key="literal">
          {match[3]}
        </span>
      );
    }

    if (/^-?\d/.test(match[0])) {
      return (
        <span className="syntax-token syntax-number" key="number">
          {match[0]}
        </span>
      );
    }

    return (
      <span className="syntax-token syntax-punctuation" key="punctuation">
        {match[0]}
      </span>
    );
  });
}

function highlightGenericCode(content: string): ReactNode[] {
  const tokenPattern =
    /(\/\/.*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:async|await|break|case|catch|class|const|continue|else|export|false|for|from|function|if|import|interface|let|new|null|return|switch|throw|true|try|type|undefined|var|while)\b|-?\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$]*(?=\s*\())/g;

  return tokenizeCode(content, tokenPattern, (match) => {
    const token = match[0];

    if (token.startsWith("//") || token.startsWith("/*")) {
      return (
        <span className="syntax-token syntax-comment" key="comment">
          {token}
        </span>
      );
    }

    if (token.startsWith('"') || token.startsWith("'") || token.startsWith("`")) {
      return (
        <span className="syntax-token syntax-string" key="string">
          {token}
        </span>
      );
    }

    if (/^-?\d/.test(token)) {
      return (
        <span className="syntax-token syntax-number" key="number">
          {token}
        </span>
      );
    }

    if (/^[A-Za-z_$]/.test(token) && !isCodeKeyword(token)) {
      return (
        <span className="syntax-token syntax-function" key="function">
          {token}
        </span>
      );
    }

    return (
      <span className="syntax-token syntax-keyword" key="keyword">
        {token}
      </span>
    );
  });
}

function tokenizeCode(
  content: string,
  tokenPattern: RegExp,
  renderToken: (match: RegExpExecArray) => ReactNode | ReactNode[],
): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let tokenIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const rendered = renderToken(match);
    const renderedParts = Array.isArray(rendered) ? rendered : [rendered];

    renderedParts.forEach((part) => {
      parts.push(
        <span className="syntax-token-wrap" key={`token-${tokenIndex}`}>
          {part}
        </span>,
      );
      tokenIndex += 1;
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts;
}

function isCodeKeyword(token: string): boolean {
  return /^(async|await|break|case|catch|class|const|continue|else|export|false|for|from|function|if|import|interface|let|new|null|return|switch|throw|true|try|type|undefined|var|while)$/.test(
    token,
  );
}
