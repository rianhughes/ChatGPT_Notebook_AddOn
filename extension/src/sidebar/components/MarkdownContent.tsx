import { ChevronDown, Copy, SendHorizontal, Trash2 } from "lucide-react";
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

import { copyText } from "../../core/clipboard";
import { SECTION_BOUNDARY_MARKER } from "../../core/markdown";
import {
  hasNoteSelectionDragData,
  NOTE_SELECTION_DRAG_TYPE,
  parseNoteSelectionDragPayload,
  type NoteSelectionDragPayload,
} from "../insertSelection";

type SourceRange = {
  start: number;
  end: number;
};

type MarkdownPart =
  | { type: "code"; language: string | null; content: string; range: SourceRange }
  | { type: "text"; content: string; range: SourceRange };

type MarkdownBlock =
  | { type: "code"; key: string; language: string | null; content: string; range: SourceRange }
  | { type: "table"; key: string; header: string[]; rows: string[][]; range: SourceRange }
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
  | { type: "paragraph"; key: string; content: string; range: SourceRange }
  | { type: "boundary"; key: string; level: number | null; range: SourceRange };

type MarkdownContentProps = {
  markdown: string;
  collapseAllHeadings?: boolean;
  selectedHeadingIndex?: number | null;
  onInsertSection?(headingIndex: number): void;
  onDeleteSection?(headingIndex: number): void;
  onSelectHeadingSection?(headingIndex: number): void;
  onMoveSelectionToSection?(headingIndex: number, selection: NoteSelectionDragPayload): void;
  onMarkdownChange?(markdown: string): void | Promise<void>;
};

export function MarkdownContent({
  markdown,
  collapseAllHeadings = false,
  selectedHeadingIndex = null,
  onInsertSection,
  onDeleteSection,
  onSelectHeadingSection,
  onMoveSelectionToSection,
  onMarkdownChange,
}: MarkdownContentProps) {
  const normalizedMarkdown = useMemo(() => markdown.replace(/\r\n/g, "\n"), [markdown]);
  const blocks = useMemo(() => parseMarkdownBlocks(normalizedMarkdown), [normalizedMarkdown]);
  const [collapsedHeadingKeys, setCollapsedHeadingKeys] = useState<Set<string>>(() => new Set());
  const [editingBlockKey, setEditingBlockKey] = useState<string | null>(null);
  const [dropTargetHeadingKey, setDropTargetHeadingKey] = useState<string | null>(null);
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

  function handleHeadingDragOver(block: Extract<MarkdownBlock, { type: "heading" }>, event: DragEvent<HTMLElement>) {
    if (!onMoveSelectionToSection || !hasNoteSelectionDragData(event.dataTransfer)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropTargetHeadingKey((current) => (current === block.key ? current : block.key));
  }

  function handleHeadingDragLeave(block: Extract<MarkdownBlock, { type: "heading" }>, event: DragEvent<HTMLElement>) {
    const nextTarget = event.relatedTarget instanceof Node ? event.relatedTarget : null;

    if (nextTarget && event.currentTarget.contains(nextTarget)) {
      return;
    }

    setDropTargetHeadingKey((current) => (current === block.key ? null : current));
  }

  function handleHeadingDrop(block: Extract<MarkdownBlock, { type: "heading" }>, event: DragEvent<HTMLElement>) {
    if (!onMoveSelectionToSection) {
      return;
    }

    const selection = parseNoteSelectionDragPayload(event.dataTransfer.getData(NOTE_SELECTION_DRAG_TYPE));

    if (!selection) {
      return;
    }

    event.preventDefault();
    setDropTargetHeadingKey(null);
    onMoveSelectionToSection(block.headingIndex, selection);
  }

  function startInlineEdit(block: MarkdownBlock, event?: MouseEvent<HTMLElement>) {
    if (!onMarkdownChange || isSavingInlineEdit) {
      return;
    }

    const target = event?.target;

    if (
      target instanceof Element &&
      target.closest(".markdown-heading-action-button, .markdown-code-copy-button, .markdown-link")
    ) {
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
        selectedHeadingIndex,
        onInsertSection,
        onDeleteSection,
        onSelectHeadingSection,
        dragDrop: onMoveSelectionToSection
          ? {
              dropTargetHeadingKey,
              onDragOver: handleHeadingDragOver,
              onDragLeave: handleHeadingDragLeave,
              onDrop: handleHeadingDrop,
            }
          : null,
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
  selectedHeadingIndex: number | null;
  onInsertSection?: (headingIndex: number) => void;
  onDeleteSection?: (headingIndex: number) => void;
  onSelectHeadingSection?: (headingIndex: number) => void;
  dragDrop: HeadingDragDropOptions | null;
  inlineEdit: InlineEditOptions | null;
};

type HeadingDragDropOptions = {
  dropTargetHeadingKey: string | null;
  onDragOver(block: Extract<MarkdownBlock, { type: "heading" }>, event: DragEvent<HTMLElement>): void;
  onDragLeave(block: Extract<MarkdownBlock, { type: "heading" }>, event: DragEvent<HTMLElement>): void;
  onDrop(block: Extract<MarkdownBlock, { type: "heading" }>, event: DragEvent<HTMLElement>): void;
};

function renderMarkdownBlocks(blocks: MarkdownBlock[], options: RenderMarkdownOptions) {
  const renderedBlocks: ReactNode[] = [];
  const collapsedSectionLevels: number[] = [];

  blocks.forEach((block, index) => {
    if (block.type === "boundary") {
      trimCollapsedSectionLevelsAtBoundary(collapsedSectionLevels, block.level);
      return;
    }

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
          isSelected: options.selectedHeadingIndex === block.headingIndex,
          onToggleHeading: options.onToggleHeading,
          onInsertSection: options.onInsertSection,
          onDeleteSection: options.onDeleteSection,
          onSelectHeadingSection: options.onSelectHeadingSection,
          dragDrop: options.dragDrop,
          isDropTarget: options.dragDrop?.dropTargetHeadingKey === block.key,
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
    isSelected?: boolean;
    onToggleHeading?: (key: string) => void;
    onInsertSection?: (headingIndex: number) => void;
    onDeleteSection?: (headingIndex: number) => void;
    onSelectHeadingSection?: (headingIndex: number) => void;
    dragDrop?: HeadingDragDropOptions | null;
    isDropTarget?: boolean;
    inlineEdit?: InlineEditOptions | null;
  },
) {
  const inlineEdit = headingOptions?.inlineEdit ?? null;
  const isInlineEditing = inlineEdit?.editingBlockKey === block.key;

  if (block.type === "boundary") {
    return null;
  }

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
    }${headingOptions?.isSelected ? " is-selected" : ""}${headingOptions?.isDropTarget ? " is-drop-target" : ""}`;

    if (isInlineEditing) {
      return <InlineHeadingEditor block={block} className={className} inlineEdit={inlineEdit!} key={block.key} />;
    }

    if (!headingOptions?.canCollapse) {
      return (
        <Fragment key={block.key}>
          <h3
            className={className}
            onDragOver={
              headingOptions?.dragDrop ? (event) => headingOptions.dragDrop?.onDragOver(block, event) : undefined
            }
            onDragLeave={
              headingOptions?.dragDrop ? (event) => headingOptions.dragDrop?.onDragLeave(block, event) : undefined
            }
            onDrop={headingOptions?.dragDrop ? (event) => headingOptions.dragDrop?.onDrop(block, event) : undefined}
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
        <h3
          className={className}
          onDragOver={
            headingOptions?.dragDrop ? (event) => headingOptions.dragDrop?.onDragOver(block, event) : undefined
          }
          onDragLeave={
            headingOptions?.dragDrop ? (event) => headingOptions.dragDrop?.onDragLeave(block, event) : undefined
          }
          onDrop={headingOptions?.dragDrop ? (event) => headingOptions.dragDrop?.onDrop(block, event) : undefined}
        >
          <span className="markdown-heading-row">
            <button
              className="markdown-heading-button"
              type="button"
              aria-expanded={!headingOptions.isCollapsed}
              title={headingOptions.isCollapsed ? "Expand section" : "Collapse section"}
              onClick={() => {
                headingOptions.onSelectHeadingSection?.(block.headingIndex);
                headingOptions.onToggleHeading?.(block.key);
              }}
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

  if (block.type === "table") {
    return (
      <div className="markdown-table-scroll" key={block.key}>
        <table className="markdown-table">
          <thead>
            <tr>
              {block.header.map((cell, cellIndex) => (
                <th key={cellIndex}>{renderInlineMarkdown(cell)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{renderInlineMarkdown(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

  const lines = splitLinesWithOffsets(content, sourceStart);

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const rawLine = lines[lineIndex];
    const line = rawLine.content.replace(/[ \t]+$/, "");

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    const boundaryLevel = getSectionBoundaryLevel(line);

    if (boundaryLevel !== undefined) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "boundary",
        key: nextKey("boundary"),
        level: boundaryLevel,
        range: { start: rawLine.start, end: rawLine.end },
      });
      continue;
    }

    const table = readMarkdownTable(lines, lineIndex);

    if (table) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "table",
        key: nextKey("table"),
        header: table.header,
        rows: table.rows,
        range: table.range,
      });
      lineIndex = table.nextLineIndex - 1;
      continue;
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
      continue;
    }

    const listItem = line.match(/^\s*[-*]\s+(.+)$/);

    if (listItem) {
      flushParagraph();

      if (listItems.length === 0) {
        listRangeStart = rawLine.start;
      }

      listRangeEnd = rawLine.end;
      listItems.push(listItem[1].trim());
      continue;
    }

    flushList();
    paragraphLines.push({
      content: line.trim(),
      start: rawLine.start,
      end: rawLine.end,
    });
  }

  flushParagraph();
  flushList();

  return blocks;
}

type ParsedMarkdownTable = {
  header: string[];
  rows: string[][];
  range: SourceRange;
  nextLineIndex: number;
};

function readMarkdownTable(lines: MarkdownLine[], startIndex: number): ParsedMarkdownTable | null {
  const headerLine = lines[startIndex];
  const separatorLine = lines[startIndex + 1];

  if (!headerLine || !separatorLine || !isMarkdownTableSeparator(separatorLine.content)) {
    return null;
  }

  const header = splitMarkdownTableCells(headerLine.content);
  const separator = splitMarkdownTableCells(separatorLine.content);

  if (header.length < 2 || separator.length < header.length) {
    return null;
  }

  const rows: string[][] = [];
  let nextLineIndex = startIndex + 2;

  while (nextLineIndex < lines.length && isMarkdownTableRow(lines[nextLineIndex].content)) {
    rows.push(padMarkdownTableRow(splitMarkdownTableCells(lines[nextLineIndex].content), header.length));
    nextLineIndex += 1;
  }

  return {
    header: padMarkdownTableRow(header, header.length),
    rows,
    range: {
      start: headerLine.start,
      end: lines[nextLineIndex - 1]?.end ?? separatorLine.end,
    },
    nextLineIndex,
  };
}

function isMarkdownTableRow(line: string): boolean {
  return splitMarkdownTableCells(line).length > 1;
}

function isMarkdownTableSeparator(line: string): boolean {
  const cells = splitMarkdownTableCells(line);
  return cells.length > 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function splitMarkdownTableCells(line: string): string[] {
  const trimmed = line.trim();

  if (!trimmed.includes("|")) {
    return [];
  }

  const content = trimmed.replace(/^\|/, "").replace(/\|$/, "");
  const cells: string[] = [];
  let cell = "";
  let isEscaped = false;

  for (const character of content) {
    if (isEscaped) {
      cell += character;
      isEscaped = false;
      continue;
    }

    if (character === "\\") {
      isEscaped = true;
      continue;
    }

    if (character === "|") {
      cells.push(cell.trim());
      cell = "";
      continue;
    }

    cell += character;
  }

  cells.push(cell.trim());
  return cells;
}

function padMarkdownTableRow(row: string[], columnCount: number): string[] {
  return [...row, ...Array.from({ length: Math.max(0, columnCount - row.length) }, () => "")].slice(0, columnCount);
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

  if (block.type === "boundary") {
    return "";
  }

  if (block.type === "table") {
    return `${renderMarkdownTableLine(block.header)}\n${renderMarkdownTableLine(
      block.header.map(() => "---"),
    )}\n${block.rows.map(renderMarkdownTableLine).join("\n")}`;
  }

  return block.content;
}

function renderMarkdownTableLine(row: string[]): string {
  return `| ${row.map((cell) => cell.replace(/\\/g, "\\\\").replace(/\|/g, "\\|")).join(" | ")} |`;
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

  if (block.type === "boundary") {
    return "";
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

    if (block.type === "boundary") {
      if (block.level === null || block.level <= heading.level) {
        return false;
      }

      continue;
    }

    return true;
  }

  return false;
}

function trimCollapsedSectionLevelsAtBoundary(collapsedSectionLevels: number[], boundaryLevel: number | null): void {
  if (boundaryLevel === null) {
    collapsedSectionLevels.length = 0;
    return;
  }

  for (let levelIndex = collapsedSectionLevels.length - 1; levelIndex >= 0; levelIndex -= 1) {
    if (collapsedSectionLevels[levelIndex] >= boundaryLevel) {
      collapsedSectionLevels.splice(levelIndex, 1);
    }
  }
}

function getSectionBoundaryLevel(line: string): number | null | undefined {
  const match = line
    .trim()
    .match(new RegExp(`^<!--\\s*${escapeRegExp(SECTION_BOUNDARY_MARKER)}(?::([1-6]))?\\s*-->$`));

  if (!match) {
    return undefined;
  }

  return match[1] ? Number(match[1]) : null;
}

function renderInlineMarkdown(text: string, keyPrefix = "inline"): ReactNode[] {
  const nodes: ReactNode[] = [];
  let index = 0;
  let textBuffer = "";

  function flushText() {
    if (!textBuffer) {
      return;
    }

    nodes.push(textBuffer);
    textBuffer = "";
  }

  while (index < text.length) {
    const code = readInlineCode(text, index);

    if (code) {
      flushText();
      nodes.push(
        <code className="markdown-inline-code" key={`${keyPrefix}-code-${nodes.length}`}>
          {code.content}
        </code>,
      );
      index = code.end;
      continue;
    }

    const link = readMarkdownLink(text, index) ?? readAutolink(text, index) ?? readBareUrl(text, index);

    if (link) {
      flushText();

      if (isSafeLinkHref(link.href)) {
        nodes.push(
          <a
            className="markdown-link"
            href={link.href}
            key={`${keyPrefix}-link-${nodes.length}`}
            target="_blank"
            rel="noreferrer"
          >
            {link.isMarkdownLink ? renderInlineMarkdown(link.label, `${keyPrefix}-link-${nodes.length}`) : link.label}
          </a>,
        );
      } else {
        textBuffer += link.label;
      }

      index = link.end;
      continue;
    }

    const strong = readStrong(text, index);

    if (strong) {
      flushText();
      nodes.push(
        <strong key={`${keyPrefix}-strong-${nodes.length}`}>
          {renderInlineMarkdown(strong.content, `${keyPrefix}-strong-${nodes.length}`)}
        </strong>,
      );
      index = strong.end;
      continue;
    }

    textBuffer += text[index];
    index += 1;
  }

  flushText();
  return nodes;
}

type InlineCodeMatch = {
  content: string;
  end: number;
};

type InlineLinkMatch = {
  label: string;
  href: string;
  end: number;
  isMarkdownLink: boolean;
};

type InlineStrongMatch = {
  content: string;
  end: number;
};

function readInlineCode(text: string, start: number): InlineCodeMatch | null {
  if (text[start] !== "`") {
    return null;
  }

  const end = text.indexOf("`", start + 1);

  if (end <= start + 1 || text.slice(start + 1, end).includes("\n")) {
    return null;
  }

  return {
    content: text.slice(start + 1, end),
    end: end + 1,
  };
}

function readMarkdownLink(text: string, start: number): InlineLinkMatch | null {
  if (text[start] !== "[") {
    return null;
  }

  const labelEnd = findUnescapedCharacter(text, "]", start + 1);

  if (labelEnd <= start + 1 || text[labelEnd + 1] !== "(") {
    return null;
  }

  const hrefEnd = findUnescapedCharacter(text, ")", labelEnd + 2);

  if (hrefEnd < 0) {
    return null;
  }

  const label = text.slice(start + 1, labelEnd).trim();
  const href = normalizeMarkdownLinkHref(text.slice(labelEnd + 2, hrefEnd));

  if (!label || !href) {
    return null;
  }

  return {
    label,
    href,
    end: hrefEnd + 1,
    isMarkdownLink: true,
  };
}

function readAutolink(text: string, start: number): InlineLinkMatch | null {
  const match = text.slice(start).match(/^<((?:https?:\/\/|mailto:)[^>\s]+)>/i);

  if (!match) {
    return null;
  }

  return {
    label: match[1],
    href: match[1],
    end: start + match[0].length,
    isMarkdownLink: false,
  };
}

function readBareUrl(text: string, start: number): InlineLinkMatch | null {
  const previous = start > 0 ? text[start - 1] : "";

  if (previous && !/\s|\(/.test(previous)) {
    return null;
  }

  const match = text.slice(start).match(/^https?:\/\/[^\s<]+/i);

  if (!match) {
    return null;
  }

  const href = trimTrailingUrlPunctuation(match[0]);

  return {
    label: href,
    href,
    end: start + href.length,
    isMarkdownLink: false,
  };
}

function readStrong(text: string, start: number): InlineStrongMatch | null {
  if (!text.startsWith("**", start)) {
    return null;
  }

  const end = text.indexOf("**", start + 2);

  if (end <= start + 2 || text.slice(start + 2, end).includes("\n")) {
    return null;
  }

  return {
    content: text.slice(start + 2, end),
    end: end + 2,
  };
}

function findUnescapedCharacter(text: string, character: string, start: number): number {
  for (let index = start; index < text.length; index += 1) {
    if (text[index] !== character) {
      continue;
    }

    let backslashCount = 0;

    for (let slashIndex = index - 1; slashIndex >= 0 && text[slashIndex] === "\\"; slashIndex -= 1) {
      backslashCount += 1;
    }

    if (backslashCount % 2 === 0) {
      return index;
    }
  }

  return -1;
}

function normalizeMarkdownLinkHref(rawHref: string): string {
  const trimmed = rawHref.trim();
  const angleWrapped = trimmed.match(/^<([^>\s]+)>/);

  if (angleWrapped) {
    return angleWrapped[1];
  }

  return trimmed.split(/\s+/)[0] ?? "";
}

function trimTrailingUrlPunctuation(url: string): string {
  return url.replace(/[),.;:!?]+$/, "");
}

function isSafeLinkHref(href: string): boolean {
  return /^(https?:\/\/|mailto:)/i.test(href);
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
    bash: "Bash",
    go: "Go",
    golang: "Go",
    js: "JavaScript",
    javascript: "JavaScript",
    json: "JSON",
    jsx: "JSX",
    md: "Markdown",
    py: "Python",
    python: "Python",
    rs: "Rust",
    rust: "Rust",
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

  return highlightLanguageCode(content, language);
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

type CodeSyntax = {
  tokenPattern: RegExp;
  keywords: Set<string>;
  literals: Set<string>;
  isComment(token: string): boolean;
  isString(token: string): boolean;
  isVariable?(token: string): boolean;
};

const jsLikeSyntax = createCodeSyntax({
  commentPattern: String.raw`\/\/.*|\/\*[\s\S]*?\*\/`,
  stringPattern: String.raw`"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|` + "`" + String.raw`(?:\\.|[^` + "`" + String.raw`\\])*` + "`",
  keywords: [
    "async",
    "await",
    "break",
    "case",
    "catch",
    "class",
    "const",
    "continue",
    "else",
    "export",
    "extends",
    "finally",
    "for",
    "from",
    "function",
    "if",
    "import",
    "interface",
    "let",
    "new",
    "return",
    "switch",
    "throw",
    "try",
    "type",
    "var",
    "while",
  ],
  literals: ["false", "null", "true", "undefined"],
});

const goSyntax = createCodeSyntax({
  commentPattern: String.raw`\/\/.*|\/\*[\s\S]*?\*\/`,
  stringPattern: String.raw`"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|` + "`" + String.raw`[\s\S]*?` + "`",
  keywords: [
    "break",
    "case",
    "chan",
    "const",
    "continue",
    "default",
    "defer",
    "else",
    "fallthrough",
    "for",
    "func",
    "go",
    "goto",
    "if",
    "import",
    "interface",
    "map",
    "package",
    "range",
    "return",
    "select",
    "struct",
    "switch",
    "type",
    "var",
  ],
  literals: ["false", "iota", "nil", "true"],
});

const pythonSyntax = createCodeSyntax({
  commentPattern: String.raw`#.*`,
  stringPattern:
    String.raw`[rubfRUBF]*"""[\s\S]*?"""|[rubfRUBF]*'''[\s\S]*?'''|[rubfRUBF]*"(?:\\.|[^"\\])*"|[rubfRUBF]*'(?:\\.|[^'\\])*'`,
  keywords: [
    "and",
    "as",
    "assert",
    "async",
    "await",
    "break",
    "class",
    "continue",
    "def",
    "del",
    "elif",
    "else",
    "except",
    "finally",
    "for",
    "from",
    "global",
    "if",
    "import",
    "in",
    "is",
    "lambda",
    "nonlocal",
    "not",
    "or",
    "pass",
    "raise",
    "return",
    "try",
    "while",
    "with",
    "yield",
  ],
  literals: ["False", "None", "True"],
});

const rustSyntax = createCodeSyntax({
  commentPattern: String.raw`\/\/.*|\/\*[\s\S]*?\*\/`,
  stringPattern: String.raw`r#*"[\s\S]*?"#*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])'`,
  keywords: [
    "as",
    "async",
    "await",
    "break",
    "const",
    "continue",
    "crate",
    "dyn",
    "else",
    "enum",
    "extern",
    "fn",
    "for",
    "if",
    "impl",
    "in",
    "let",
    "loop",
    "match",
    "mod",
    "move",
    "mut",
    "pub",
    "ref",
    "return",
    "self",
    "Self",
    "static",
    "struct",
    "super",
    "trait",
    "type",
    "unsafe",
    "use",
    "where",
    "while",
  ],
  literals: ["false", "None", "Some", "true"],
  functionPattern: String.raw`[A-Za-z_][\w_]*(?=\s*[(!])`,
});

const shellSyntax = createCodeSyntax({
  commentPattern: String.raw`#.*`,
  stringPattern: String.raw`"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'`,
  keywords: [
    "case",
    "do",
    "done",
    "elif",
    "else",
    "esac",
    "fi",
    "for",
    "function",
    "if",
    "in",
    "then",
    "until",
    "while",
  ],
  literals: ["false", "true"],
  variablePattern: String.raw`\$\{?[A-Za-z_][\w]*\}?|\$[0-9@#?*!-]`,
});

function highlightLanguageCode(content: string, language: string): ReactNode[] {
  const syntax = getCodeSyntax(language);

  return tokenizeCode(content, syntax.tokenPattern, (match) => {
    const token = match[0];

    if (syntax.isComment(token)) {
      return renderSyntaxToken("comment", token);
    }

    if (syntax.isString(token)) {
      return renderSyntaxToken("string", token);
    }

    if (syntax.isVariable?.(token)) {
      return renderSyntaxToken("variable", token);
    }

    if (/^-?\b\d/.test(token)) {
      return renderSyntaxToken("number", token);
    }

    if (syntax.literals.has(token)) {
      return renderSyntaxToken("literal", token);
    }

    if (syntax.keywords.has(token)) {
      return renderSyntaxToken("keyword", token);
    }

    if (isIdentifierToken(token)) {
      return renderSyntaxToken("function", token);
    }

    return token;
  });
}

function getCodeSyntax(language: string): CodeSyntax {
  if (language === "go" || language === "golang") {
    return goSyntax;
  }

  if (language === "py" || language === "python") {
    return pythonSyntax;
  }

  if (language === "rs" || language === "rust") {
    return rustSyntax;
  }

  if (language === "bash" || language === "sh" || language === "shell") {
    return shellSyntax;
  }

  return jsLikeSyntax;
}

function createCodeSyntax({
  commentPattern,
  stringPattern,
  keywords,
  literals,
  variablePattern,
  functionPattern = String.raw`[A-Za-z_$][\w$]*(?=\s*\()`,
}: {
  commentPattern: string;
  stringPattern: string;
  keywords: string[];
  literals: string[];
  variablePattern?: string;
  functionPattern?: string;
}): CodeSyntax {
  const tokenPattern =
    new RegExp(
      [
        commentPattern,
        stringPattern,
        variablePattern,
        String.raw`\b(?:${keywords.map(escapeRegExp).join("|")})\b`,
        String.raw`\b(?:${literals.map(escapeRegExp).join("|")})\b`,
        String.raw`-?\b\d+(?:\.\d+)?\b`,
        functionPattern,
      ]
        .filter(Boolean)
        .join("|"),
      "g",
    );
  const commentRegExp = new RegExp(`^(?:${commentPattern})$`);
  const stringRegExp = new RegExp(`^(?:${stringPattern})$`);
  const variableRegExp = variablePattern ? new RegExp(`^(?:${variablePattern})$`) : null;

  return {
    tokenPattern,
    keywords: new Set(keywords),
    literals: new Set(literals),
    isComment: (token) => commentRegExp.test(token),
    isString: (token) => stringRegExp.test(token),
    isVariable: variableRegExp ? (token) => variableRegExp.test(token) : undefined,
  };
}

function isIdentifierToken(token: string): boolean {
  return /^[A-Za-z_$][\w$]*$/.test(token);
}

function renderSyntaxToken(type: string, token: string): ReactNode {
  return (
    <span className={`syntax-token syntax-${type}`} key={type}>
      {token}
    </span>
  );
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
