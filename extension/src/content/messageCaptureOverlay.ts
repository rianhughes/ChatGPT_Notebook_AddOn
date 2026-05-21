import browser from "../browser/extensionApi";
import { sendRuntimeMessage } from "../browser/runtime";
import type { SaveChatGptMessageResponse } from "../core/ports";
import { isExtensionMessage } from "../core/ports";
import {
  extractMessageFromContainer,
  extractSelectionFromDocument,
  findConversationRoot,
  findVisibleMessageContainers,
} from "./chatgptDomAdapter";

const BOUND_ATTRIBUTE = "data-cgpt-notes-bound";
const ACTION_ATTRIBUTE = "data-cgpt-notes-action";
const OVERLAY_CLASS = "cgpt-notes-capture";
const BUTTON_CLASS = "cgpt-notes-save-button";
const SELECTION_POPOVER_CLASS = "cgpt-notes-selection-popover";
const EXPORT_LABEL = "Export to ChatGPT Note";

export type OverlayController = {
  scan(): void;
  stop(): void;
};

export function startMessageCaptureOverlay(): OverlayController {
  const root = findConversationRoot();
  const selectionButton = createSelectionButton();
  let refreshHandle: number | null = null;
  let selectionHandle: number | null = null;
  let stopped = false;

  const observer = new MutationObserver(() => {
    scheduleScan();
  });

  observer.observe(root, { childList: true, subtree: true, characterData: true });

  const runtimeListener = (message: unknown) => {
    if (!isExtensionMessage(message)) {
      return;
    }

    if (message.type === "ACTIVE_SAVE_TARGET_CHANGED") {
      scan();
    }
  };

  browser.runtime.onMessage.addListener(runtimeListener);
  document.addEventListener("click", handleDocumentClick, true);
  document.addEventListener("selectionchange", scheduleSelectionRefresh);
  document.addEventListener("mouseup", scheduleSelectionRefresh);
  document.addEventListener("keyup", scheduleSelectionRefresh);

  const controller: OverlayController = {
    scan,
    stop() {
      stopped = true;
      observer.disconnect();
      browser.runtime.onMessage.removeListener(runtimeListener);
      document.removeEventListener("click", handleDocumentClick, true);
      document.removeEventListener("selectionchange", scheduleSelectionRefresh);
      document.removeEventListener("mouseup", scheduleSelectionRefresh);
      document.removeEventListener("keyup", scheduleSelectionRefresh);
      selectionButton.remove();

      if (refreshHandle !== null) {
        window.clearTimeout(refreshHandle);
      }

      if (selectionHandle !== null) {
        window.clearTimeout(selectionHandle);
      }
    },
  };

  scan();
  return controller;

  function scheduleScan() {
    if (stopped || refreshHandle !== null) {
      return;
    }

    refreshHandle = window.setTimeout(() => {
      refreshHandle = null;
      scan();
    }, 180);
  }

  function scheduleSelectionRefresh() {
    if (stopped || selectionHandle !== null) {
      return;
    }

    selectionHandle = window.setTimeout(() => {
      selectionHandle = null;
      updateSelectionButton(selectionButton);
    }, 80);
  }

  function scan() {
    if (stopped) {
      return;
    }

    const containers = findVisibleMessageContainers(root);

    containers.forEach((container) => {
      if (!container.hasAttribute(BOUND_ATTRIBUTE) || !getMessageButton(container)) {
        attachButton(container);
      }
    });
  }

  function handleDocumentClick(event: MouseEvent): void {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>(`.${BUTTON_CLASS}`);

    if (!button) {
      return;
    }

    const action = button.getAttribute(ACTION_ATTRIBUTE);

    if (action !== "export-message" && action !== "export-selection") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (button.disabled) {
      return;
    }

    if (action === "export-selection") {
      void saveSelectedMessage(button);
      return;
    }

    const container = button.closest<HTMLElement>(`[${BOUND_ATTRIBUTE}]`);

    if (!container) {
      setButtonError(button);
      return;
    }

    void saveContainerMessage(container, button);
  }
}

function createSelectionButton(): HTMLButtonElement {
  const button = document.createElement("button");

  button.type = "button";
  button.className = `${BUTTON_CLASS} ${SELECTION_POPOVER_CLASS}`;
  button.textContent = EXPORT_LABEL;
  button.title = "Export selected text to ChatGPT Notes";
  button.setAttribute("aria-label", "Export selected text to ChatGPT Notes");
  button.setAttribute(ACTION_ATTRIBUTE, "export-selection");

  button.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });

  document.body.append(button);
  hideSelectionButton(button);
  return button;
}

function attachButton(container: HTMLElement): void {
  container.querySelectorAll(`.${OVERLAY_CLASS}`).forEach((element) => element.remove());

  const wrapper = document.createElement("span");
  const button = document.createElement("button");

  wrapper.className = OVERLAY_CLASS;
  button.type = "button";
  button.className = BUTTON_CLASS;
  button.textContent = EXPORT_LABEL;
  button.title = "Export message to ChatGPT Notes";
  button.setAttribute("aria-label", "Export message to ChatGPT Notes");
  button.setAttribute(ACTION_ATTRIBUTE, "export-message");

  wrapper.append(button);
  container.append(wrapper);
  container.setAttribute(BOUND_ATTRIBUTE, "true");
}

async function saveContainerMessage(container: HTMLElement, button: HTMLButtonElement): Promise<void> {
  const extracted = extractMessageFromContainer(container);

  if (!extracted) {
    setButtonError(button);
    return;
  }

  button.disabled = true;
  button.classList.remove("has-error");
  button.textContent = EXPORT_LABEL;
  let exported = false;

  try {
    await sendRuntimeMessage<SaveChatGptMessageResponse>({
      type: "SAVE_CHATGPT_MESSAGE",
      payload: {
        sourceThreadId: extracted.sourceThreadId,
        title: extracted.title,
        sourceMessageId: extracted.sourceMessageId,
        sourceMessageKey: createExportSourceMessageKey(extracted.sourceMessageKey),
        contentHash: extracted.contentHash,
        role: extracted.role,
        contentMarkdown: extracted.contentMarkdown,
        contentText: extracted.contentText,
      },
    });
    exported = true;
  } catch {
    setButtonError(button);
  } finally {
    button.disabled = false;
    if (exported) {
      resetExportButton(button);
    }
  }
}

async function saveSelectedMessage(button: HTMLButtonElement): Promise<void> {
  const extracted = extractSelectionFromDocument(window.getSelection());

  if (!extracted) {
    hideSelectionButton(button);
    return;
  }

  button.disabled = true;
  button.classList.remove("has-error");
  button.textContent = EXPORT_LABEL;
  let exported = false;

  try {
    await sendRuntimeMessage<SaveChatGptMessageResponse>({
      type: "SAVE_CHATGPT_MESSAGE",
      payload: {
        sourceThreadId: extracted.sourceThreadId,
        title: extracted.title,
        sourceMessageId: extracted.sourceMessageId,
        sourceMessageKey: createExportSourceMessageKey(extracted.sourceMessageKey),
        contentHash: extracted.contentHash,
        role: extracted.role,
        contentMarkdown: extracted.contentMarkdown,
        contentText: extracted.contentText,
      },
    });
    exported = true;
    window.setTimeout(() => hideSelectionButton(button), 900);
  } catch {
    setButtonError(button);
  } finally {
    button.disabled = false;
    if (exported) {
      resetExportButton(button);
    }
  }
}

function updateSelectionButton(button: HTMLButtonElement): void {
  const selection = window.getSelection();
  const extracted = extractSelectionFromDocument(selection);

  if (!selection || !extracted) {
    hideSelectionButton(button);
    return;
  }

  const range = selection.getRangeAt(0);
  const rect = getUsefulRangeRect(range);

  if (!rect) {
    hideSelectionButton(button);
    return;
  }

  button.classList.remove("is-saved", "has-error");
  button.disabled = false;
  button.textContent = EXPORT_LABEL;
  button.style.left = `${Math.min(window.innerWidth - 16, Math.max(8, rect.left + rect.width / 2))}px`;
  button.style.top = `${Math.max(8, rect.top - 42)}px`;
  button.style.display = "inline-flex";
}

function getMessageButton(container: HTMLElement): HTMLButtonElement | null {
  return container.querySelector<HTMLButtonElement>(`.${BUTTON_CLASS}[${ACTION_ATTRIBUTE}="export-message"]`);
}

function getUsefulRangeRect(range: Range): DOMRect | null {
  const rects = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0);

  if (rects[0]) {
    return rects[0];
  }

  const fallback = range.getBoundingClientRect();
  return fallback.width > 0 && fallback.height > 0 ? fallback : null;
}

function hideSelectionButton(button: HTMLButtonElement): void {
  button.style.display = "none";
  button.classList.remove("is-saved", "has-error");
  button.disabled = false;
  button.textContent = EXPORT_LABEL;
}

function resetExportButton(button: HTMLButtonElement): void {
  button.classList.remove("is-saved", "has-error");
  button.textContent = EXPORT_LABEL;
}

function setButtonError(button: HTMLButtonElement): void {
  button.classList.add("has-error");
  button.classList.remove("is-saved");
  button.textContent = EXPORT_LABEL;
  button.disabled = false;
}

function createExportSourceMessageKey(baseKey: string): string {
  return `export:${baseKey}:${Date.now().toString(36)}:${createRandomSuffix()}`;
}

function createRandomSuffix(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}
