import type { InsertTextInChatGptResponse } from "../core/ports";

type ComposerElement = HTMLTextAreaElement | HTMLElement;

const COMPOSER_SELECTORS = [
  "textarea#prompt-textarea",
  "#prompt-textarea[contenteditable='true']",
  "[data-testid='composer-text-input'][contenteditable='true']",
  ".ProseMirror[contenteditable='true']",
  "textarea",
  "div[contenteditable='true']",
];

export function insertTextIntoChatGptComposer(text: string): InsertTextInChatGptResponse {
  const normalizedText = text.trim();

  if (!normalizedText) {
    return { inserted: false, error: "Nothing to insert." };
  }

  const composer = findChatGptComposer();

  if (!composer) {
    return { inserted: false, error: "Could not find the ChatGPT text box." };
  }

  const textToInsert = getInsertionText(composer, normalizedText);

  if (composer instanceof HTMLTextAreaElement) {
    insertIntoTextarea(composer, textToInsert);
  } else {
    insertIntoContentEditable(composer, textToInsert);
  }

  return { inserted: true };
}

function findChatGptComposer(root: ParentNode = document): ComposerElement | null {
  for (const selector of COMPOSER_SELECTORS) {
    const element = root.querySelector<ComposerElement>(selector);

    if (element && isVisibleElement(element)) {
      return element;
    }
  }

  return null;
}

function getInsertionText(composer: ComposerElement, text: string): string {
  const currentText =
    composer instanceof HTMLTextAreaElement ? composer.value.trim() : (composer.textContent ?? "").trim();

  return currentText ? `\n\n${text}` : text;
}

function insertIntoTextarea(textarea: HTMLTextAreaElement, text: string): void {
  textarea.focus();
  const selectionStart = textarea.selectionStart ?? textarea.value.length;
  const selectionEnd = textarea.selectionEnd ?? textarea.value.length;
  textarea.setRangeText(text, selectionStart, selectionEnd, "end");
  textarea.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
}

function insertIntoContentEditable(element: HTMLElement, text: string): void {
  element.focus();
  ensureSelectionInsideElement(element);

  if (document.execCommand?.("insertText", false, text)) {
    element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
    return;
  }

  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    element.textContent = `${element.textContent ?? ""}${text}`;
  } else {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
}

function ensureSelectionInsideElement(element: HTMLElement): void {
  const selection = window.getSelection();

  if (
    selection?.anchorNode &&
    selection.focusNode &&
    element.contains(selection.anchorNode) &&
    element.contains(selection.focusNode)
  ) {
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function isVisibleElement(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0 || element instanceof HTMLTextAreaElement;
}
