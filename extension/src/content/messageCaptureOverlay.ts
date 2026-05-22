import browser from "../browser/extensionApi";
import { sendRuntimeMessage } from "../browser/runtime";
import { parseAiOperationPackagesFromMarkdown } from "../core/aiOperationProtocol";
import type { SaveChatGptMessageResponse, SubmitAiOperationPackageResponse } from "../core/ports";
import { isExtensionMessage } from "../core/ports";
import type { MessageCaptureAdapter } from "./sourceAdapter";

const BOUND_ATTRIBUTE = "data-cgpt-notes-bound";
const ACTION_ATTRIBUTE = "data-cgpt-notes-action";
const OVERLAY_CLASS = "cgpt-notes-capture";
const BUTTON_CLASS = "cgpt-notes-save-button";
const BUTTON_ICON_CLASS = "cgpt-notes-save-button-icon";
const AI_OPS_BUTTON_CLASS = "cgpt-notes-ai-ops-button";
const SELECTION_POPOVER_CLASS = "cgpt-notes-selection-popover";
const AI_OPS_LABEL = "Review note changes";

export type OverlayController = {
  scan(): void;
  stop(): void;
};

export function startMessageCaptureOverlay(adapter: MessageCaptureAdapter): OverlayController {
  const root = adapter.findConversationRoot();
  const selectionButton = createSelectionButton(adapter);
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
      updateSelectionButton(selectionButton, adapter);
    }, 80);
  }

  function scan() {
    if (stopped) {
      return;
    }

    const containers = adapter.findVisibleMessageContainers(root);

    containers.forEach((container) => {
      if (
        !container.hasAttribute(BOUND_ATTRIBUTE) ||
        !getMessageButton(container) ||
        (hasAiOperationPackage(container, adapter) && !getAiOperationsButton(container))
      ) {
        attachButton(container, adapter);
      }
    });
  }

  function handleDocumentClick(event: MouseEvent): void {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>(`.${BUTTON_CLASS}`);

    if (!button) {
      return;
    }

    const action = button.getAttribute(ACTION_ATTRIBUTE);

    if (action !== "export-message" && action !== "export-selection" && action !== "review-ai-ops") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (button.disabled) {
      return;
    }

    if (action === "export-selection") {
      void saveSelectedMessage(button, adapter);
      return;
    }

    const container = button.closest<HTMLElement>(`[${BOUND_ATTRIBUTE}]`);

    if (!container) {
      setButtonError(button, adapter);
      return;
    }

    if (action === "review-ai-ops") {
      void reviewAiOperations(container, button, adapter);
      return;
    }

    void saveContainerMessage(container, button, adapter);
  }
}

function createSelectionButton(adapter: MessageCaptureAdapter): HTMLButtonElement {
  const button = document.createElement("button");

  button.type = "button";
  button.className = `${BUTTON_CLASS} ${SELECTION_POPOVER_CLASS}`;
  setButtonContent(button, adapter);
  button.title = adapter.labels.exportSelection;
  button.setAttribute("aria-label", adapter.labels.exportSelection);
  button.setAttribute(ACTION_ATTRIBUTE, "export-selection");

  button.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });

  document.body.append(button);
  hideSelectionButton(button, adapter);
  return button;
}

function attachButton(container: HTMLElement, adapter: MessageCaptureAdapter): void {
  container.querySelectorAll(`.${OVERLAY_CLASS}`).forEach((element) => element.remove());

  const wrapper = document.createElement("span");
  const button = document.createElement("button");

  wrapper.className = OVERLAY_CLASS;
  button.type = "button";
  button.className = BUTTON_CLASS;
  setButtonContent(button, adapter);
  button.title = adapter.labels.exportMessage;
  button.setAttribute("aria-label", adapter.labels.exportMessage);
  button.setAttribute(ACTION_ATTRIBUTE, "export-message");

  wrapper.append(button);

  const aiOpsButton = createAiOperationsButton(container, adapter);

  if (aiOpsButton) {
    wrapper.append(aiOpsButton);
  }

  container.append(wrapper);
  container.setAttribute(BOUND_ATTRIBUTE, "true");
}

function createAiOperationsButton(container: HTMLElement, adapter: MessageCaptureAdapter): HTMLButtonElement | null {
  if (!adapter.supportsAiOperations || !hasAiOperationPackage(container, adapter)) {
    return null;
  }

  const extracted = adapter.extractMessageFromContainer(container);

  if (!extracted || extracted.role !== "assistant") {
    return null;
  }

  const packages = parseAiOperationPackagesFromMarkdown(extracted.contentMarkdown, {
    sourceThreadId: extracted.sourceThreadId,
    sourceTitle: extracted.title,
  });

  if (packages.length === 0) {
    return null;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = `${BUTTON_CLASS} ${AI_OPS_BUTTON_CLASS}`;
  button.textContent = AI_OPS_LABEL;
  button.title = "Review ChatGPT note changes";
  button.setAttribute("aria-label", "Review ChatGPT note changes");
  button.setAttribute(ACTION_ATTRIBUTE, "review-ai-ops");
  return button;
}

function hasAiOperationPackage(container: HTMLElement, adapter: MessageCaptureAdapter): boolean {
  if (!adapter.supportsAiOperations) {
    return false;
  }

  const extracted = adapter.extractMessageFromContainer(container);

  if (!extracted || extracted.role !== "assistant") {
    return false;
  }

  return (
    parseAiOperationPackagesFromMarkdown(extracted.contentMarkdown, {
      sourceThreadId: extracted.sourceThreadId,
      sourceTitle: extracted.title,
    }).length > 0
  );
}

async function saveContainerMessage(
  container: HTMLElement,
  button: HTMLButtonElement,
  adapter: MessageCaptureAdapter,
): Promise<void> {
  const extracted = adapter.extractMessageFromContainer(container);

  if (!extracted) {
    setButtonError(button, adapter);
    return;
  }

  button.disabled = true;
  button.classList.remove("has-error");
  setButtonContent(button, adapter);
  let exported = false;

  try {
    await sendRuntimeMessage<SaveChatGptMessageResponse>({
      type: "SAVE_CHATGPT_MESSAGE",
      payload: {
        sourceThreadId: extracted.sourceThreadId,
        source: extracted.source,
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
    setButtonError(button, adapter);
  } finally {
    button.disabled = false;
    if (exported) {
      resetExportButton(button, adapter);
    }
  }
}

async function saveSelectedMessage(button: HTMLButtonElement, adapter: MessageCaptureAdapter): Promise<void> {
  const extracted = adapter.extractSelectionFromDocument(window.getSelection());

  if (!extracted) {
    hideSelectionButton(button, adapter);
    return;
  }

  button.disabled = true;
  button.classList.remove("has-error");
  setButtonContent(button, adapter);
  let exported = false;

  try {
    await sendRuntimeMessage<SaveChatGptMessageResponse>({
      type: "SAVE_CHATGPT_MESSAGE",
      payload: {
        sourceThreadId: extracted.sourceThreadId,
        source: extracted.source,
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
    window.setTimeout(() => hideSelectionButton(button, adapter), 900);
  } catch {
    setButtonError(button, adapter);
  } finally {
    button.disabled = false;
    if (exported) {
      resetExportButton(button, adapter);
    }
  }
}

async function reviewAiOperations(
  container: HTMLElement,
  button: HTMLButtonElement,
  adapter: MessageCaptureAdapter,
): Promise<void> {
  const extracted = adapter.extractMessageFromContainer(container);

  if (!extracted) {
    setButtonError(button, adapter);
    return;
  }

  const [operationPackage] = parseAiOperationPackagesFromMarkdown(extracted.contentMarkdown, {
    sourceThreadId: extracted.sourceThreadId,
    sourceTitle: extracted.title,
  });

  if (!operationPackage) {
    setButtonError(button, adapter);
    return;
  }

  button.disabled = true;
  button.classList.remove("has-error");
  let queued = false;

  try {
    const response = await sendRuntimeMessage<SubmitAiOperationPackageResponse>({
      type: "SUBMIT_AI_OPERATION_PACKAGE",
      payload: operationPackage,
    });

    queued = response.queued;

    if (!response.queued) {
      setButtonError(button, adapter);
    }
  } catch {
    setButtonError(button, adapter);
  } finally {
    button.disabled = false;

    if (queued) {
      button.classList.add("is-saved");
    }
  }
}

function updateSelectionButton(button: HTMLButtonElement, adapter: MessageCaptureAdapter): void {
  const selection = window.getSelection();
  const extracted = adapter.extractSelectionFromDocument(selection);

  if (!selection || !extracted) {
    hideSelectionButton(button, adapter);
    return;
  }

  const range = selection.getRangeAt(0);
  const rect = getUsefulRangeRect(range);

  if (!rect) {
    hideSelectionButton(button, adapter);
    return;
  }

  button.classList.remove("is-saved", "has-error");
  button.disabled = false;
  setButtonContent(button, adapter);
  button.style.left = `${Math.min(window.innerWidth - 16, Math.max(8, rect.left + rect.width / 2))}px`;
  button.style.top = `${Math.max(8, rect.top - 42)}px`;
  button.style.display = "inline-flex";
}

function getMessageButton(container: HTMLElement): HTMLButtonElement | null {
  return container.querySelector<HTMLButtonElement>(`.${BUTTON_CLASS}[${ACTION_ATTRIBUTE}="export-message"]`);
}

function getAiOperationsButton(container: HTMLElement): HTMLButtonElement | null {
  return container.querySelector<HTMLButtonElement>(`.${BUTTON_CLASS}[${ACTION_ATTRIBUTE}="review-ai-ops"]`);
}

function getUsefulRangeRect(range: Range): DOMRect | null {
  const rects = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0);

  if (rects[0]) {
    return rects[0];
  }

  const fallback = range.getBoundingClientRect();
  return fallback.width > 0 && fallback.height > 0 ? fallback : null;
}

function hideSelectionButton(button: HTMLButtonElement, adapter: MessageCaptureAdapter): void {
  button.style.display = "none";
  button.classList.remove("is-saved", "has-error");
  button.disabled = false;
  button.textContent = adapter.labels.exportMessage;
}

function resetExportButton(button: HTMLButtonElement, adapter: MessageCaptureAdapter): void {
  button.classList.remove("is-saved", "has-error");
  setButtonContent(button, adapter);
}

function setButtonError(button: HTMLButtonElement, adapter: MessageCaptureAdapter): void {
  button.classList.add("has-error");
  button.classList.remove("is-saved");
  setButtonContent(button, adapter);
  button.disabled = false;
}

function setButtonContent(button: HTMLButtonElement, adapter: MessageCaptureAdapter): void {
  if (button.getAttribute(ACTION_ATTRIBUTE) === "review-ai-ops") {
    button.textContent = AI_OPS_LABEL;
    return;
  }

  button.replaceChildren();

  const icon = document.createElement("img");
  icon.className = BUTTON_ICON_CLASS;
  icon.src = browser.runtime.getURL("icon.png");
  icon.alt = "";
  icon.setAttribute("aria-hidden", "true");

  const label = document.createElement("span");
  label.textContent = adapter.labels.exportMessage;

  button.append(icon, label);
}

function createExportSourceMessageKey(baseKey: string): string {
  return `export:${baseKey}:${Date.now().toString(36)}:${createRandomSuffix()}`;
}

function createRandomSuffix(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}
