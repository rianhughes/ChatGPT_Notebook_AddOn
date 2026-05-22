import { ChevronDown, Copy, SendHorizontal, Trash2 } from "lucide-react";
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

import { copyText } from "../../core/clipboard";

type SourceRange = {
  start: number;
  end: number;
};

type MarkdownPart =
  | { type: "code"; language: string | null; content: string; range: SourceRange }
  | { type: "text"; content: string; range: SourceRange };

type MarkdownBlock =
  | { type: "code"; key: string; language: string | null; content: string; range: SourceRange }
  | {
      type: "heading";
      key: string;
      level: number;
      styleLevel: number;
      headingIndex: number;
      content: string;
      range: SourceRange;
    }
  | { type: "list"; key: string; items: string[]; range: SourceRange }
  | { type: "paragraph"; key: string; content: string; range: SourceRange };

type MarkdownContentProps = {
  markdown: string;
  collapseAllHeadings?: boolean;
  onInsertSection?(headingIndex: number): void;
  onDeleteSection?(headingIndex: number): void;
  onMarkdownChange?(markdown: string): void | Promise<void>;
};

export function MarkdownContent({
  markdown,
  collapseAllHeadings = false,
  onInsertSection,
  onDeleteSection,
  onMarkdownChange,
}: MarkdownContentProps) {
  const normalizedMarkdown = useMemo(() => markdown.replace(/\r\n/g, "\n"), [markdown]);
  const blocks = useMemo(() => parseMarkdownBlocks(normalizedMarkdown), [normalizedMarkdown]);
  const [collapsedHeadingKeys, setCollapsedHeadingKeys] = useState<Set<string>>(() => new Set());
  const [editingBlockKey, setEditingBlockKey] = useState<string | null>(null);
  const [inlineDraftValue, setInlineDraftValue] = useState("");
  const [isSavingInlineEdit, setIsSavingInlineEdit] = useState(false);
  const collapseAllHeadingsAppliedRef = useRef(false);
  const cancelNextInlineBlurRef = useRef(false);
  const isCommittingInlineEditRef = useRef(false);

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

  useEffect(() => {
    if (editingBlockKey && !blocks.some((block) => block.key === editingBlockKey)) {
      setEditingBlockKey(null);
      setInlineDraftValue("");
    }
  }, [blocks, editingBlockKey]);

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

  function startInlineEdit(block: MarkdownBlock, event?: MouseEvent<HTMLElement>) {
    if (!onMarkdownChange || isSavingInlineEdit) {
      return;
    }

    const target = event?.target;

    if (target instanceof Element && target.closest(".markdown-heading-action-button, .markdown-code-copy-button")) {
      return;
    }

    event?.preventDefault();
    event?.stopPropagation();
    cancelNextInlineBlurRef.current = false;
    setEditingBlockKey(block.key);
    setInlineDraftValue(getEditableBlockValue(block));
  }

  function cancelInlineEdit() {
    cancelNextInlineBlurRef.current = true;
    setEditingBlockKey(null);
    setInlineDraftValue("");
  }

  async function commitInlineEdit(block: MarkdownBlock, nextValue = inlineDraftValue) {
    if (!onMarkdownChange || editingBlockKey !== block.key || isCommittingInlineEditRef.current) {
      return;
    }

    if (cancelNextInlineBlurRef.current) {
      cancelNextInlineBlurRef.current = false;
      return;
    }

    const nextMarkdown = replaceMarkdownBlock(normalizedMarkdown, block, nextValue);

    setEditingBlockKey(null);
    setInlineDraftValue("");

    if (nextMarkdown === normalizedMarkdown) {
      return;
    }

    isCommittingInlineEditRef.current = true;
    setIsSavingInlineEdit(true);

    try {
      await onMarkdownChange(nextMarkdown);
    } finally {
      isCommittingInlineEditRef.current = false;
      setIsSavingInlineEdit(false);
    }
  }

  return (
    <div className="rendered-message">
      {renderMarkdownBlocks(blocks, {
        collapsedHeadingKeys,
        onToggleHeading: toggleHeading,
        onInsertSection,
        onDeleteSection,
        inlineEdit: onMarkdownChange
          ? {
              editingBlockKey,
              draftValue: inlineDraftValue,
              isSaving: isSavingInlineEdit,
              onStart: startInlineEdit,
              onChange: setInlineDraftValue,
              onCommit: (block, value) => void commitInlineEdit(block, value),
              onCancel: cancelInlineEdit,
            }
          : null,
      })}
    </div>
  );
}

function getCollapsibleHeadingKeys(blocks: MarkdownBlock[]): string[] {
  return blocks
    .map((block, index) => (block.type === "heading" && hasCollapsibleSection(blocks, index) ? block.key : null))
    .filter((key): key is string => Boolean(key));
}

type InlineEditOptions = {
  editingBlockKey: string | null;
  draftValue: string;
  isSaving: boolean;
  onStart(block: MarkdownBlock, event: MouseEvent<HTMLElement>): void;
  onChange(value: string): void;
  onCommit(block: MarkdownBlock, value?: string): void;
  onCancel(): void;
};

type RenderMarkdownOptions = {
  collapsedHeadingKeys: Set<string>;
  onToggleHeading: (key: string) => void;
  onInsertSection?: (headingIndex: number) => void;
  onDeleteSection?: (headingIndex: number) => void;
  inlineEdit: InlineEditOptions | null;
};

function renderMarkdownBlocks(blocks: MarkdownBlock[], options: RenderMarkdownOptions) {
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

      const isCollapsed = options.collapsedHeadingKeys.has(block.key);

      renderedBlocks.push(
        renderMarkdownBlock(block, {
          canCollapse: hasCollapsibleSection(blocks, index),
          isCollapsed,
          onToggleHeading: options.onToggleHeading,
          onInsertSection: options.onInsertSection,
          onDeleteSection: options.onDeleteSection,
          inlineEdit: options.inlineEdit,
        }),
      );

      if (isCollapsed) {
        collapsedSectionLevels.push(block.level);
      }

      return;
    }

    if (collapsedSectionLevels.length === 0) {
      renderedBlocks.push(renderMarkdownBlock(block, { inlineEdit: options.inlineEdit }));
    }
  });

  return renderedBlocks;
}

function renderMarkdownBlock(
  block: MarkdownBlock,
  headingOptions?: {
    canCollapse?: boolean;
    isCollapsed?: boolean;
    onToggleHeading?: (key: string) => void;
    onInsertSection?: (headingIndex: number) => void;
    onDeleteSection?: (headingIndex: number) => void;
    inlineEdit?: InlineEditOptions | null;
  },
) {
  const inlineEdit = headingOptions?.inlineEdit ?? null;
  const isInlineEditing = inlineEdit?.editingBlockKey === block.key;

  if (block.type === "code") {
    if (isInlineEditing) {
      return <InlineCodeEditor block={block} inlineEdit={inlineEdit!} key={block.key} />;
    }

    return (
      <CodeBlock
        language={block.language}
        content={block.content}
        key={block.key}
        onDoubleClick={inlineEdit ? (event) => inlineEdit.onStart(block, event) : undefined}
      />
    );
  }

  if (block.type === "heading") {
    const className = `markdown-heading markdown-heading-level-${block.styleLevel}${
      headingOptions?.isCollapsed ? " is-collapsed" : ""
    }`;

    if (isInlineEditing) {
      return <InlineHeadingEditor block={block} className={className} inlineEdit={inlineEdit!} key={block.key} />;
    }

    if (!headingOptions?.canCollapse) {
      return (
        <Fragment key={block.key}>
          <h3
            className={className}
            onDoubleClick={inlineEdit ? (event) => inlineEdit.onStart(block, event) : undefined}
          >
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
        <h3 className={className}>
          <span className="markdown-heading-row">
            <button
              className="markdown-heading-button"
              type="button"
              aria-expanded={!headingOptions.isCollapsed}
              title={headingOptions.isCollapsed ? "Expand section" : "Collapse section"}
              onClick={() => headingOptions.onToggleHeading?.(block.key)}
              onDoubleClick={inlineEdit ? (event) => inlineEdit.onStart(block, event) : undefined}
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
    if (isInlineEditing) {
      return <InlineTextBlockEditor block={block} className="markdown-list" inlineEdit={inlineEdit!} key={block.key} />;
    }

    return (
      <ul
        className="markdown-list"
        key={block.key}
        onDoubleClick={inlineEdit ? (event) => inlineEdit.onStart(block, event) : undefined}
      >
        {block.items.map((item, itemIndex) => (
          <li key={itemIndex}>{renderInlineMarkdown(item)}</li>
        ))}
      </ul>
    );
  }

  if (isInlineEditing) {
    return (
      <InlineTextBlockEditor block={block} className="markdown-paragraph" inlineEdit={inlineEdit!} key={block.key} />
    );
  }

  return (
    <p
      className="markdown-paragraph"
      key={block.key}
      onDoubleClick={inlineEdit ? (event) => inlineEdit.onStart(block, event) : undefined}
    >
      {renderInlineMarkdown(block.content)}
    </p>
  );
}

function CodeBlock({
  language,
  content,
  onDoubleClick,
}: {
  language: string | null;
  content: string;
  onDoubleClick?: (event: MouseEvent<HTMLElement>) => void;
}) {
  const normalizedLanguage = normalizeLanguage(language, content);
  const formattedContent = formatCodeContent(normalizedLanguage, content);

  return (
    <figure className="markdown-code-card" onDoubleClick={onDoubleClick}>
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

function InlineHeadingEditor({
  block,
  className,
  inlineEdit,
}: {
  block: Extract<MarkdownBlock, { type: "heading" }>;
  className: string;
  inlineEdit: InlineEditOptions;
}) {
  return (
    <h3 className={`${className} is-inline-editing`}>
      <span className="markdown-heading-row">
        <InlinePlainTextInput
          ariaLabel="Edit heading"
          className="markdown-inline-editor markdown-heading-editor"
          value={inlineEdit.draftValue}
          disabled={inlineEdit.isSaving}
          onChange={inlineEdit.onChange}
          onCommit={(value) => inlineEdit.onCommit(block, value)}
          onCancel={inlineEdit.onCancel}
        />
      </span>
    </h3>
  );
}

function InlineTextBlockEditor({
  block,
  className,
  inlineEdit,
}: {
  block: Extract<MarkdownBlock, { type: "list" | "paragraph" }>;
  className: string;
  inlineEdit: InlineEditOptions;
}) {
  return (
    <div className={`${className} is-inline-editing`}>
      <InlinePlainTextArea
        ariaLabel={block.type === "list" ? "Edit list" : "Edit paragraph"}
        className="markdown-inline-editor markdown-block-editor"
        value={inlineEdit.draftValue}
        disabled={inlineEdit.isSaving}
        minRows={block.type === "list" ? 3 : 2}
        onChange={inlineEdit.onChange}
        onCommit={(value) => inlineEdit.onCommit(block, value)}
        onCancel={inlineEdit.onCancel}
      />
    </div>
  );
}

function InlineCodeEditor({
  block,
  inlineEdit,
}: {
  block: Extract<MarkdownBlock, { type: "code" }>;
  inlineEdit: InlineEditOptions;
}) {
  const normalizedLanguage = normalizeLanguage(block.language, block.content);

  return (
    <figure className="markdown-code-card is-inline-editing">
      <figcaption className="markdown-code-header">
        <span>{getLanguageLabel(normalizedLanguage)}</span>
      </figcaption>
      <InlinePlainTextArea
        ariaLabel="Edit code"
        className={`markdown-inline-editor markdown-code-editor language-${normalizedLanguage}`}
        value={inlineEdit.draftValue}
        disabled={inlineEdit.isSaving}
        minRows={4}
        onChange={inlineEdit.onChange}
        onCommit={(value) => inlineEdit.onCommit(block, value)}
        onCancel={inlineEdit.onCancel}
      />
    </figure>
  );
}

function InlinePlainTextInput({
  ariaLabel,
  className,
  value,
  disabled,
  onChange,
  onCommit,
  onCancel,
}: {
  ariaLabel: string;
  className: string;
  value: string;
  disabled: boolean;
  onChange(value: string): void;
  onCommit(value: string): void;
  onCancel(): void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <input
      ref={inputRef}
      className={className}
      type="text"
      aria-label={ariaLabel}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      onBlur={(event) => onCommit(event.currentTarget.value)}
      onKeyDown={(event) => handleInlineEditorKeyDown(event, onCommit, onCancel, false)}
    />
  );
}

function InlinePlainTextArea({
  ariaLabel,
  className,
  value,
  disabled,
  minRows,
  onChange,
  onCommit,
  onCancel,
}: {
  ariaLabel: string;
  className: string;
  value: string;
  disabled: boolean;
  minRows: number;
  onChange(value: string): void;
  onCommit(value: string): void;
  onCancel(): void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.focus();
    textarea.setSelectionRange(0, textarea.value.length);
  }, []);

  return (
    <textarea
      ref={textareaRef}
      className={className}
      aria-label={ariaLabel}
      value={value}
      disabled={disabled}
      rows={getInlineEditorRows(value, minRows)}
      onChange={(event) => onChange(event.target.value)}
      onBlur={(event) => onCommit(event.currentTarget.value)}
      onKeyDown={(event) => handleInlineEditorKeyDown(event, onCommit, onCancel, true)}
    />
  );
}

function handleInlineEditorKeyDown(
  event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  onCommit: (value: string) => void,
  onCancel: () => void,
  allowShiftEnterNewline: boolean,
) {
  if (event.key === "Escape") {
    event.preventDefault();
    onCancel();
    return;
  }

  if (event.key === "Enter" && !(allowShiftEnterNewline && event.shiftKey)) {
    event.preventDefault();
    onCommit(event.currentTarget.value);
  }
}

function getInlineEditorRows(value: string, minRows: number): number {
  return Math.max(minRows, Math.min(18, value.split("\n").length + 1));
}

function splitMarkdown(markdown: string): MarkdownPart[] {
  const parts: MarkdownPart[] = [];
  const codeBlockPattern = /```([^\n`]*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockPattern.exec(markdown)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: markdown.slice(lastIndex, match.index),
        range: { start: lastIndex, end: match.index },
      });
    }

    const fullMatch = match[0];
    const openingFence = fullMatch.match(/^```([^\n`]*)\n?/);
    const contentStart = match.index + (openingFence?.[0].length ?? 3);
    const closingStart = match.index + fullMatch.length - 3;

    parts.push({
      type: "code",
      language: match[1]?.trim() || null,
      content: markdown.slice(contentStart, Math.max(contentStart, closingStart)).replace(/\n$/, ""),
      range: { start: match.index, end: match.index + fullMatch.length },
    });
    lastIndex = match.index + fullMatch.length;
  }

  if (lastIndex < markdown.length) {
    parts.push({
      type: "text",
      content: markdown.slice(lastIndex),
      range: { start: lastIndex, end: markdown.length },
    });
  }

  return parts.length > 0 ? parts : [{ type: "text", content: markdown, range: { start: 0, end: markdown.length } }];
}

function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  let headingIndex = 0;
  const blocks: MarkdownBlock[] = splitMarkdown(markdown).flatMap((part, partIndex): MarkdownBlock[] => {
    if (part.type === "code") {
      return [
        {
          type: "code",
          key: `code-${partIndex}`,
          language: part.language,
          content: part.content,
          range: part.range,
        },
      ];
    }

    return parseTextBlocks(part.content, `text-${partIndex}`, part.range.start);
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

function parseTextBlocks(content: string, keyPrefix: string, sourceStart: number): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const paragraphLines: MarkdownLine[] = [];
  const listItems: string[] = [];
  let listRangeStart: number | null = null;
  let listRangeEnd: number | null = null;
  let blockIndex = 0;

  function nextKey(type: string) {
    const key = `${keyPrefix}-${type}-${blockIndex}`;
    blockIndex += 1;
    return key;
  }

  function flushParagraph() {
    const paragraph = paragraphLines.map((line) => line.content).join("\n").trim();

    if (paragraph) {
      blocks.push({
        type: "paragraph",
        key: nextKey("paragraph"),
        content: paragraph,
        range: {
          start: paragraphLines[0].start,
          end: paragraphLines[paragraphLines.length - 1].end,
        },
      });
    }

    paragraphLines.length = 0;
  }

  function flushList() {
    if (listItems.length > 0) {
      blocks.push({
        type: "list",
        key: nextKey("list"),
        items: [...listItems],
        range: { start: listRangeStart ?? 0, end: listRangeEnd ?? listRangeStart ?? 0 },
      });
      listItems.length = 0;
      listRangeStart = null;
      listRangeEnd = null;
    }
  }

  splitLinesWithOffsets(content, sourceStart).forEach((rawLine) => {
    const line = rawLine.content.replace(/[ \t]+$/, "");

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
        range: { start: rawLine.start, end: rawLine.end },
      });
      return;
    }

    const listItem = line.match(/^\s*[-*]\s+(.+)$/);

    if (listItem) {
      flushParagraph();

      if (listItems.length === 0) {
        listRangeStart = rawLine.start;
      }

      listRangeEnd = rawLine.end;
      listItems.push(listItem[1].trim());
      return;
    }

    flushList();
    paragraphLines.push({
      content: line.trim(),
      start: rawLine.start,
      end: rawLine.end,
    });
  });

  flushParagraph();
  flushList();

  return blocks;
}

type MarkdownLine = {
  content: string;
  start: number;
  end: number;
};

function splitLinesWithOffsets(content: string, sourceStart: number): MarkdownLine[] {
  const lines: MarkdownLine[] = [];
  let lineStart = 0;

  for (let index = 0; index <= content.length; index += 1) {
    if (index !== content.length && content[index] !== "\n") {
      continue;
    }

    lines.push({
      content: content.slice(lineStart, index),
      start: sourceStart + lineStart,
      end: sourceStart + index,
    });
    lineStart = index + 1;
  }

  return lines;
}

function getEditableBlockValue(block: MarkdownBlock): string {
  if (block.type === "list") {
    return block.items.join("\n");
  }

  return block.content;
}

function replaceMarkdownBlock(markdown: string, block: MarkdownBlock, nextValue: string): string {
  const replacement = getMarkdownBlockReplacement(block, nextValue);
  return `${markdown.slice(0, block.range.start)}${replacement}${markdown.slice(block.range.end)}`;
}

function getMarkdownBlockReplacement(block: MarkdownBlock, nextValue: string): string {
  const normalizedValue = nextValue.replace(/\r\n/g, "\n");

  if (block.type === "heading") {
    const headingText = normalizedValue.replace(/\s+/g, " ").trim();
    return headingText ? `${"#".repeat(block.level)} ${headingText}` : "";
  }

  if (block.type === "list") {
    return normalizedValue
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `- ${line}`)
      .join("\n");
  }

  if (block.type === "code") {
    const language = block.language ? block.language.trim() : "";
    const openingFence = language ? `\`\`\`${language}` : "```";
    return `${openingFence}\n${normalizedValue.replace(/\n$/, "")}\n\`\`\``;
  }

  return normalizedValue.trim();
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
