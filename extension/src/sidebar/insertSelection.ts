export const NOTE_SELECTION_DRAG_TYPE = "application/x-chatgpt-notes-selection";

export type NoteSelectionDragPayload = {
  messageId: string;
  text: string;
};

export function getHighlightedText(selection: Selection | null, container: HTMLElement | null): string | null {
  if (!selection || selection.isCollapsed || !container || !selectionBelongsToElement(selection, container)) {
    return null;
  }

  const text = selection.toString().trim();
  return text || null;
}

export function getHighlightedInsertText(selection: Selection | null, container: HTMLElement | null): string | null {
  if (!selection) {
    return null;
  }

  const text = getHighlightedText(selection, container);

  if (!text) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const anchorElement = getElementForNode(range.commonAncestorContainer);

  if (anchorElement?.closest(".markdown-code-block")) {
    return `\`\`\`\n${text}\n\`\`\``;
  }

  if (anchorElement?.closest(".markdown-inline-code")) {
    return text.includes("\n") ? `\`\`\`\n${text}\n\`\`\`` : `\`${text}\``;
  }

  return text;
}

export function selectionBelongsToElement(selection: Selection, element: HTMLElement): boolean {
  return Boolean(
    selection.anchorNode &&
      selection.focusNode &&
      element.contains(selection.anchorNode) &&
      element.contains(selection.focusNode),
  );
}

export function encodeNoteSelectionDragPayload(payload: NoteSelectionDragPayload): string {
  return JSON.stringify(payload);
}

export function parseNoteSelectionDragPayload(value: string): NoteSelectionDragPayload | null {
  try {
    const parsed = JSON.parse(value) as Partial<NoteSelectionDragPayload>;
    const messageId = typeof parsed.messageId === "string" ? parsed.messageId : "";
    const text = typeof parsed.text === "string" ? parsed.text.trim() : "";

    return messageId && text ? { messageId, text } : null;
  } catch {
    return null;
  }
}

export function hasNoteSelectionDragData(dataTransfer: DataTransfer): boolean {
  return Array.from(dataTransfer.types).includes(NOTE_SELECTION_DRAG_TYPE);
}

function getElementForNode(node: Node): Element | null {
  return node instanceof Element ? node : node.parentElement;
}
