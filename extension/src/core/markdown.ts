export const SECTION_BOUNDARY_MARKER = "cgpt-notes-section-boundary";

export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(getSectionBoundaryLinePattern("gm"), "")
    .replace(/```[\s\S]*?```/g, (block) =>
      block
        .replace(/^```[^\n]*\n?/, "")
        .replace(/\n?```$/, "")
        .trim(),
    )
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function deleteExactTextFromMarkdown(markdown: string, selectedText: string): string | null {
  const normalizedMarkdown = markdown.replace(/\r\n/g, "\n");
  const range = findSelectedTextRangeInMarkdown(normalizedMarkdown, selectedText);

  if (!range) {
    return null;
  }

  return normalizeAfterDeletion(`${normalizedMarkdown.slice(0, range.start)}${normalizedMarkdown.slice(range.end)}`);
}

export function convertSelectedTextToHeadingInMarkdown(
  markdown: string,
  selectedText: string,
  level = 2,
): string | null {
  const normalizedMarkdown = markdown.replace(/\r\n/g, "\n");
  const range = findSelectedTextRangeInMarkdown(normalizedMarkdown, selectedText);
  const headingText = markdownToPlainText(selectedText).replace(/\s+/g, " ").trim();

  if (!range || !headingText) {
    return null;
  }

  const headingLevel = Math.min(6, Math.max(1, Math.trunc(level) || 2));
  const decoratedRange = expandInlineMarkdownDecorationRange(normalizedMarkdown, range);
  const replacement = `${"#".repeat(headingLevel)} ${headingText}`;
  const lineRange = getContainingLineRange(normalizedMarkdown, decoratedRange);
  const lineBeforeSelection = normalizedMarkdown.slice(lineRange.start, decoratedRange.start);
  const lineAfterSelection = normalizedMarkdown.slice(decoratedRange.end, lineRange.end);
  const selectionIsOnlyLineContent = !lineBeforeSelection.trim() && !lineAfterSelection.trim();
  const selectionIsExistingHeadingText = /^ {0,3}#{1,6}\s+$/.test(lineBeforeSelection) && !lineAfterSelection.trim();

  if (selectionIsOnlyLineContent || selectionIsExistingHeadingText) {
    const suffix = normalizedMarkdown.slice(lineRange.end);
    return normalizeAfterHeadingConversion(
      `${normalizedMarkdown.slice(0, lineRange.start)}${getBoundedHeadingReplacement(
        replacement,
        suffix,
        headingLevel,
      )}${suffix}`,
    );
  }

  const splitRange = trimAdjacentHorizontalWhitespace(normalizedMarkdown, decoratedRange, lineRange);
  const needsLeadingBreak = splitRange.start > 0 && normalizedMarkdown[splitRange.start - 1] !== "\n";
  const needsTrailingBreak = splitRange.end < normalizedMarkdown.length && normalizedMarkdown[splitRange.end] !== "\n";
  const suffix = normalizedMarkdown.slice(splitRange.end);

  return normalizeAfterHeadingConversion(
    `${normalizedMarkdown.slice(0, splitRange.start)}${needsLeadingBreak ? "\n\n" : ""}${getBoundedHeadingReplacement(
      replacement,
      suffix,
      headingLevel,
    )}${needsTrailingBreak ? "\n\n" : ""}${suffix}`,
  );
}

export function moveSelectedTextToHeadingSectionInMarkdown(
  markdown: string,
  selectedText: string,
  headingIndex: number,
): string | null {
  if (headingIndex < 0 || !Number.isInteger(headingIndex)) {
    return null;
  }

  const normalizedMarkdown = markdown.replace(/\r\n/g, "\n");
  const selectedRange = findSelectedTextRangeInMarkdown(normalizedMarkdown, selectedText);
  const headings = getMarkdownHeadings(normalizedMarkdown);
  const targetHeading = headings[headingIndex];

  if (!selectedRange || !targetHeading) {
    return null;
  }

  const sourceRange = getMoveSourceRange(normalizedMarkdown, selectedRange);
  const movedMarkdown = normalizedMarkdown.slice(sourceRange.start, sourceRange.end).trim();
  const insertionPoint = targetHeading.lineEnd;

  if (!movedMarkdown || (insertionPoint >= sourceRange.start && insertionPoint <= sourceRange.end)) {
    return null;
  }

  const withoutSource = `${normalizedMarkdown.slice(0, sourceRange.start)}${normalizedMarkdown.slice(sourceRange.end)}`;
  const adjustedInsertionPoint =
    sourceRange.start < insertionPoint ? insertionPoint - (sourceRange.end - sourceRange.start) : insertionPoint;

  return insertMarkdownAfterHeadingLine(withoutSource, adjustedInsertionPoint, movedMarkdown);
}

export function replaceSelectedTextInMarkdown(
  markdown: string,
  selectedText: string,
  replacementText: string,
): string | null {
  const normalizedMarkdown = markdown.replace(/\r\n/g, "\n");
  const selectedRange = findSelectedTextRangeInMarkdown(normalizedMarkdown, selectedText);

  if (!selectedRange) {
    return null;
  }

  const replacement = replacementText.replace(/\r\n/g, "\n").trim();
  const replacementRange = replacement
    ? expandInlineMarkdownDecorationRange(normalizedMarkdown, selectedRange)
    : getMoveSourceRange(normalizedMarkdown, selectedRange);

  return normalizeAfterSelectionReplacement(
    `${normalizedMarkdown.slice(0, replacementRange.start)}${replacement}${normalizedMarkdown.slice(
      replacementRange.end,
    )}`,
  );
}

export function unmakeHeadingSectionInMarkdown(markdown: string, headingIndex: number): string | null {
  if (headingIndex < 0 || !Number.isInteger(headingIndex)) {
    return null;
  }

  const normalizedMarkdown = markdown.replace(/\r\n/g, "\n");
  const heading = getMarkdownHeadings(normalizedMarkdown)[headingIndex];

  if (!heading) {
    return null;
  }

  const headingLine = normalizedMarkdown.slice(heading.start, heading.lineEnd);
  const unmadeLine = headingLine.replace(/^([ \t]{0,3})#{1,6}\s+(.+?)\s*$/, "$1$2");
  const boundary = getSectionBoundaryAfterHeading(normalizedMarkdown, heading);

  if (unmadeLine === headingLine) {
    return null;
  }

  const suffixStart = boundary?.end ?? heading.lineEnd;

  return normalizeAfterHeadingConversion(
    `${normalizedMarkdown.slice(0, heading.start)}${unmadeLine}${normalizedMarkdown.slice(
      heading.lineEnd,
      boundary?.start ?? heading.lineEnd,
    )}${normalizedMarkdown.slice(suffixStart)}`,
  );
}

export function deleteHeadingSectionFromMarkdown(markdown: string, headingIndex: number): string | null {
  if (headingIndex < 0 || !Number.isInteger(headingIndex)) {
    return null;
  }

  const normalizedMarkdown = markdown.replace(/\r\n/g, "\n");
  const headings = getMarkdownHeadings(normalizedMarkdown);
  const range = getHeadingSectionRange(headings, headingIndex, normalizedMarkdown.length, normalizedMarkdown, true);

  if (!range) {
    return null;
  }

  return normalizeAfterDeletion(`${normalizedMarkdown.slice(0, range.start)}${normalizedMarkdown.slice(range.end)}`);
}

export function extractHeadingSectionFromMarkdown(markdown: string, headingIndex: number): string | null {
  if (headingIndex < 0 || !Number.isInteger(headingIndex)) {
    return null;
  }

  const normalizedMarkdown = markdown.replace(/\r\n/g, "\n");
  const headings = getMarkdownHeadings(normalizedMarkdown);
  const range = getHeadingSectionRange(headings, headingIndex, normalizedMarkdown.length, normalizedMarkdown, false);

  if (!range) {
    return null;
  }

  return removeSectionBoundaryMarkers(normalizedMarkdown.slice(range.start, range.end)).trim();
}

function normalizeAfterDeletion(markdown: string): string {
  return markdown.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function normalizeAfterHeadingConversion(markdown: string): string {
  return markdown.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function normalizeAfterMove(markdown: string): string {
  return markdown.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function normalizeAfterSelectionReplacement(markdown: string): string {
  return markdown.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function removeSectionBoundaryMarkers(markdown: string): string {
  return markdown.replace(getSectionBoundaryLinePattern("gm"), "").replace(/\n{3,}/g, "\n\n");
}

function getBoundedHeadingReplacement(headingMarkdown: string, suffix: string, headingLevel: number): string {
  return suffix.trim() ? `${headingMarkdown}\n\n${getSectionBoundaryMarker(headingLevel)}` : headingMarkdown;
}

function findSelectedTextRangeInMarkdown(markdown: string, selectedText: string): SourceRange | null {
  const normalizedSelection = selectedText.replace(/\r\n/g, "\n").trim();

  if (!normalizedSelection) {
    return null;
  }

  const directIndex = markdown.indexOf(normalizedSelection);

  if (directIndex >= 0) {
    return { start: directIndex, end: directIndex + normalizedSelection.length };
  }

  const collapsedSelection = normalizedSelection.replace(/[ \t]+\n/g, "\n");
  const collapsedIndex = markdown.indexOf(collapsedSelection);

  if (collapsedIndex >= 0) {
    return { start: collapsedIndex, end: collapsedIndex + collapsedSelection.length };
  }

  return findLooseVisibleTextMatch(markdown, normalizedSelection);
}

function getContainingLineRange(markdown: string, range: SourceRange): SourceRange {
  const lineStart = markdown.lastIndexOf("\n", Math.max(0, range.start - 1)) + 1;
  const lineEndIndex = markdown.indexOf("\n", range.end);

  return {
    start: lineStart,
    end: lineEndIndex >= 0 ? lineEndIndex : markdown.length,
  };
}

function expandInlineMarkdownDecorationRange(markdown: string, range: SourceRange): SourceRange {
  if (
    range.start >= 2 &&
    markdown.slice(range.start - 2, range.start) === "**" &&
    markdown.slice(range.end, range.end + 2) === "**"
  ) {
    return { start: range.start - 2, end: range.end + 2 };
  }

  if (range.start >= 1 && markdown[range.start - 1] === "`" && markdown[range.end] === "`") {
    return { start: range.start - 1, end: range.end + 1 };
  }

  if (range.start >= 1 && markdown[range.start - 1] === "_" && markdown[range.end] === "_") {
    return { start: range.start - 1, end: range.end + 1 };
  }

  if (range.start >= 1 && markdown[range.start - 1] === "[") {
    const linkTarget = markdown.slice(range.end).match(/^\]\([^)]+\)/);

    if (linkTarget) {
      return { start: range.start - 1, end: range.end + linkTarget[0].length };
    }
  }

  return range;
}

function getMoveSourceRange(markdown: string, selectedRange: SourceRange): SourceRange {
  const decoratedRange = expandMovableMarkdownRange(markdown, selectedRange);
  const lineRange = getContainingLineRange(markdown, decoratedRange);
  const lineBeforeSelection = markdown.slice(lineRange.start, decoratedRange.start);
  const lineAfterSelection = markdown.slice(decoratedRange.end, lineRange.end);

  if (!lineBeforeSelection.trim() && !lineAfterSelection.trim()) {
    return lineRange;
  }

  return trimAdjacentHorizontalWhitespace(markdown, decoratedRange, lineRange);
}

function expandMovableMarkdownRange(markdown: string, range: SourceRange): SourceRange {
  const decoratedRange = expandInlineMarkdownDecorationRange(markdown, range);
  const lineRange = getContainingLineRange(markdown, decoratedRange);
  const lineBeforeSelection = markdown.slice(lineRange.start, decoratedRange.start);
  const lineAfterSelection = markdown.slice(decoratedRange.end, lineRange.end);

  if (!lineAfterSelection.trim() && /^ {0,3}#{1,6}\s+$/.test(lineBeforeSelection)) {
    return { start: lineRange.start, end: decoratedRange.end };
  }

  if (!lineAfterSelection.trim() && /^\s*[-*]\s+$/.test(lineBeforeSelection)) {
    return { start: lineRange.start, end: decoratedRange.end };
  }

  return decoratedRange;
}

function insertMarkdownAfterHeadingLine(markdown: string, insertionPoint: number, movedMarkdown: string): string {
  const before = markdown.slice(0, insertionPoint).replace(/[ \t]+$/, "");
  const after = markdown.slice(insertionPoint).replace(/^\n+/, "");
  const suffix = after ? `\n\n${after}` : "";

  return normalizeAfterMove(`${before}\n\n${movedMarkdown.trim()}${suffix}`);
}

function getSectionBoundaryAfterHeading(markdown: string, heading: MarkdownHeading): SourceRange | null {
  const headings = getMarkdownHeadings(markdown);
  const nextPeerOrParent = headings.find(
    (nextHeading) => nextHeading.start > heading.start && nextHeading.level <= heading.level,
  );
  const searchEnd = nextPeerOrParent?.start ?? markdown.length;

  return findSectionBoundary(markdown, heading.lineEnd, searchEnd, heading.level);
}

function trimAdjacentHorizontalWhitespace(markdown: string, range: SourceRange, lineRange: SourceRange): SourceRange {
  let start = range.start;
  let end = range.end;

  while (start > lineRange.start && /[ \t]/.test(markdown[start - 1])) {
    start -= 1;
  }

  while (end < lineRange.end && /[ \t]/.test(markdown[end])) {
    end += 1;
  }

  return { start, end };
}

type MarkdownHeading = {
  level: number;
  start: number;
  lineEnd: number;
};

function getHeadingSectionRange(
  headings: MarkdownHeading[],
  headingIndex: number,
  markdownLength: number,
  markdown: string,
  includeBoundary: boolean,
): SourceRange | null {
  const heading = headings[headingIndex];

  if (!heading) {
    return null;
  }

  const nextPeerOrParent = headings
    .slice(headingIndex + 1)
    .find((nextHeading) => nextHeading.level <= heading.level);
  const boundary = findSectionBoundary(
    markdown,
    heading.lineEnd,
    nextPeerOrParent?.start ?? markdownLength,
    heading.level,
  );

  return {
    start: heading.start,
    end: boundary ? (includeBoundary ? boundary.end : boundary.start) : nextPeerOrParent?.start ?? markdownLength,
  };
}

function findSectionBoundary(markdown: string, start: number, end: number, headingLevel: number): SourceRange | null {
  const sliced = markdown.slice(start, end);
  const boundaryPattern = getSectionBoundarySearchPattern();
  let match: RegExpExecArray | null;

  while ((match = boundaryPattern.exec(sliced)) !== null) {
    const markerLevel = match[3] ? Number(match[3]) : null;

    if (markerLevel !== null && markerLevel > headingLevel) {
      continue;
    }

    const prefixLength = match[1]?.length ?? 0;
    const lineStart = start + match.index + prefixLength;
    const markerLength = match[2]?.length ?? 0;
    const lineEnd = lineStart + markerLength;
    const includesTrailingNewline = markdown[lineEnd] === "\n";

    return {
      start: lineStart,
      end: includesTrailingNewline ? lineEnd + 1 : lineEnd,
    };
  }

  return null;
}

function getMarkdownHeadings(markdown: string): MarkdownHeading[] {
  const headings: MarkdownHeading[] = [];
  const lines = markdown.split("\n");
  let offset = 0;
  let inFence = false;

  lines.forEach((line) => {
    const fence = line.match(/^```/);

    if (!inFence) {
      if (isSectionBoundaryLine(line)) {
        offset += line.length + 1;
        return;
      }

      const heading = line.match(/^ {0,3}(#{1,6})\s+(.+?)\s*$/);

      if (heading) {
        headings.push({ level: heading[1].length, start: offset, lineEnd: offset + line.length });
      }
    }

    if (fence) {
      inFence = !inFence;
    }

    offset += line.length + 1;
  });

  return headings;
}

type SourceRange = {
  start: number;
  end: number;
};

type VisibleTextMap = {
  text: string;
  ranges: SourceRange[];
};

function findLooseVisibleTextMatch(markdown: string, selectedText: string): SourceRange | null {
  const visibleMap = buildVisibleTextMap(markdown);
  const comparableMarkdown = buildComparableTextMap(visibleMap.text, visibleMap.ranges);
  const comparableSelection = collapseWhitespace(selectedText);

  if (!comparableSelection) {
    return null;
  }

  const index = comparableMarkdown.text.indexOf(comparableSelection);

  if (index < 0) {
    return null;
  }

  const startRange = comparableMarkdown.ranges[index];
  const endRange = comparableMarkdown.ranges[index + comparableSelection.length - 1];

  if (!startRange || !endRange) {
    return null;
  }

  return {
    start: startRange.start,
    end: endRange.end,
  };
}

function buildVisibleTextMap(markdown: string): VisibleTextMap {
  const text: string[] = [];
  const ranges: SourceRange[] = [];
  let index = 0;

  while (index < markdown.length) {
    const codeFence = markdown.slice(index).match(/^```[^\n]*\n?([\s\S]*?)```/);

    if (codeFence) {
      const fullMatch = codeFence[0];
      const content = codeFence[1] ?? "";
      const contentStart = index + fullMatch.indexOf(content);
      appendMappedText(text, ranges, content, contentStart);
      index += fullMatch.length;
      continue;
    }

    const link = markdown.slice(index).match(/^\[([^\]]+)\]\([^)]+\)/);

    if (link) {
      const fullMatch = link[0];
      const label = link[1] ?? "";
      appendMappedText(text, ranges, label, index + 1);
      index += fullMatch.length;
      continue;
    }

    const inlineCode = markdown.slice(index).match(/^`([^`\n]+)`/);

    if (inlineCode) {
      const fullMatch = inlineCode[0];
      const content = inlineCode[1] ?? "";
      appendMappedText(text, ranges, content, index + 1);
      index += fullMatch.length;
      continue;
    }

    const strong = markdown.slice(index).match(/^\*\*([^*]+)\*\*/);

    if (strong) {
      const fullMatch = strong[0];
      const content = strong[1] ?? "";
      appendMappedText(text, ranges, content, index + 2);
      index += fullMatch.length;
      continue;
    }

    const italic = markdown.slice(index).match(/^_([^_\n]+)_/);

    if (italic) {
      const fullMatch = italic[0];
      const content = italic[1] ?? "";
      appendMappedText(text, ranges, content, index + 1);
      index += fullMatch.length;
      continue;
    }

    const lineStart = index === 0 || markdown[index - 1] === "\n";

    if (lineStart) {
      const boundary = markdown.slice(index).match(getSectionBoundaryStartPattern());

      if (boundary) {
        index += boundary[0].length;
        continue;
      }

      const heading = markdown.slice(index).match(/^( {0,3}#{1,6}\s+)/);

      if (heading) {
        index += heading[0].length;
        continue;
      }

      const listMarker = markdown.slice(index).match(/^(\s*[-*]\s+)/);

      if (listMarker) {
        index += listMarker[0].length;
        continue;
      }
    }

    appendMappedChar(text, ranges, markdown[index], index);
    index += 1;
  }

  return { text: text.join(""), ranges };
}

function buildComparableTextMap(text: string, ranges: SourceRange[]): VisibleTextMap {
  const comparableText: string[] = [];
  const comparableRanges: SourceRange[] = [];
  let index = 0;

  while (index < text.length) {
    if (/\s/.test(text[index])) {
      let end = index + 1;

      while (end < text.length && /\s/.test(text[end])) {
        end += 1;
      }

      if (comparableText.length > 0) {
        comparableText.push(" ");
        comparableRanges.push({
          start: ranges[index].start,
          end: ranges[end - 1].end,
        });
      }

      index = end;
      continue;
    }

    comparableText.push(text[index]);
    comparableRanges.push(ranges[index]);
    index += 1;
  }

  if (comparableText[comparableText.length - 1] === " ") {
    comparableText.pop();
    comparableRanges.pop();
  }

  return { text: comparableText.join(""), ranges: comparableRanges };
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function appendMappedText(text: string[], ranges: SourceRange[], value: string, sourceStart: number): void {
  for (let offset = 0; offset < value.length; offset += 1) {
    appendMappedChar(text, ranges, value[offset], sourceStart + offset);
  }
}

function appendMappedChar(text: string[], ranges: SourceRange[], value: string, sourceIndex: number): void {
  text.push(value);
  ranges.push({ start: sourceIndex, end: sourceIndex + 1 });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getSectionBoundaryMarker(headingLevel: number): string {
  return `<!-- ${SECTION_BOUNDARY_MARKER}:${headingLevel} -->`;
}

function isSectionBoundaryLine(line: string): boolean {
  return getSectionBoundaryLinePattern().test(line);
}

function getSectionBoundaryLinePattern(flags = ""): RegExp {
  return new RegExp(`^\\s*<!--\\s*${escapeRegExp(SECTION_BOUNDARY_MARKER)}(?::[1-6])?\\s*-->\\s*$`, flags);
}

function getSectionBoundaryStartPattern(): RegExp {
  return new RegExp(
    `^[ \\t]*<!--\\s*${escapeRegExp(SECTION_BOUNDARY_MARKER)}(?::[1-6])?\\s*-->[ \\t]*(?:\\n|$)`,
  );
}

function getSectionBoundarySearchPattern(): RegExp {
  return new RegExp(
    `(^|\\n)([ \\t]*<!--\\s*${escapeRegExp(SECTION_BOUNDARY_MARKER)}(?::([1-6]))?\\s*-->[ \\t]*)(?=\\n|$)`,
    "g",
  );
}
