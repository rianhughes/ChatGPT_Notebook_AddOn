export function markdownToPlainText(markdown: string): string {
  return markdown
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
  const normalizedSelection = selectedText.replace(/\r\n/g, "\n").trim();

  if (!normalizedSelection) {
    return null;
  }

  const normalizedMarkdown = markdown.replace(/\r\n/g, "\n");
  const directIndex = normalizedMarkdown.indexOf(normalizedSelection);

  if (directIndex >= 0) {
    return normalizeAfterDeletion(
      `${normalizedMarkdown.slice(0, directIndex)}${normalizedMarkdown.slice(
        directIndex + normalizedSelection.length,
      )}`,
    );
  }

  const collapsedSelection = normalizedSelection.replace(/[ \t]+\n/g, "\n");
  const collapsedIndex = normalizedMarkdown.indexOf(collapsedSelection);

  if (collapsedIndex >= 0) {
    return normalizeAfterDeletion(
      `${normalizedMarkdown.slice(0, collapsedIndex)}${normalizedMarkdown.slice(
        collapsedIndex + collapsedSelection.length,
      )}`,
    );
  }

  const looseMatch = findLooseVisibleTextMatch(normalizedMarkdown, normalizedSelection);

  if (looseMatch) {
    return normalizeAfterDeletion(
      `${normalizedMarkdown.slice(0, looseMatch.start)}${normalizedMarkdown.slice(looseMatch.end)}`,
    );
  }

  return null;
}

export function deleteHeadingSectionFromMarkdown(markdown: string, headingIndex: number): string | null {
  if (headingIndex < 0 || !Number.isInteger(headingIndex)) {
    return null;
  }

  const normalizedMarkdown = markdown.replace(/\r\n/g, "\n");
  const headings = getMarkdownHeadings(normalizedMarkdown);
  const range = getHeadingSectionRange(headings, headingIndex, normalizedMarkdown.length);

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
  const range = getHeadingSectionRange(headings, headingIndex, normalizedMarkdown.length);

  if (!range) {
    return null;
  }

  return normalizedMarkdown.slice(range.start, range.end).trim();
}

function normalizeAfterDeletion(markdown: string): string {
  return markdown.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

type MarkdownHeading = {
  level: number;
  start: number;
};

function getHeadingSectionRange(
  headings: MarkdownHeading[],
  headingIndex: number,
  markdownLength: number,
): SourceRange | null {
  const heading = headings[headingIndex];

  if (!heading) {
    return null;
  }

  const nextPeerOrParent = headings
    .slice(headingIndex + 1)
    .find((nextHeading) => nextHeading.level <= heading.level);

  return {
    start: heading.start,
    end: nextPeerOrParent?.start ?? markdownLength,
  };
}

function getMarkdownHeadings(markdown: string): MarkdownHeading[] {
  const headings: MarkdownHeading[] = [];
  const lines = markdown.split("\n");
  let offset = 0;
  let inFence = false;

  lines.forEach((line) => {
    const fence = line.match(/^```/);

    if (!inFence) {
      const heading = line.match(/^ {0,3}(#{1,6})\s+(.+?)\s*$/);

      if (heading) {
        headings.push({ level: heading[1].length, start: offset });
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
