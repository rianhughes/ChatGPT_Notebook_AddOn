import { addRuntimeMessageListener, sendRuntimeMessage } from "../browser/runtime";
import { isExtensionMessage } from "../core/ports";
import { insertTextIntoChatGptComposer } from "./chatgptComposerAdapter";
import { chatGptCaptureAdapter } from "./chatgptDomAdapter";
import { deepWikiCaptureAdapter } from "./deepwikiDomAdapter";
import { startMessageCaptureOverlay, type OverlayController } from "./messageCaptureOverlay";
import type { MessageCaptureAdapter } from "./sourceAdapter";

declare global {
  interface Window {
    __chatGptNotesContentScriptStarted?: boolean;
  }
}

let controller: OverlayController | null = null;
let lastConversationId: string | null = null;
let lastSource: string | null = null;

if (!window.__chatGptNotesContentScriptStarted) {
  window.__chatGptNotesContentScriptStarted = true;
  bootstrap();
}

function bootstrap(): void {
  addRuntimeMessageListener((rawMessage: unknown) => {
    if (!isExtensionMessage(rawMessage) || rawMessage.type !== "INSERT_TEXT_IN_CHATGPT") {
      return undefined;
    }

    return insertTextIntoChatGptComposer(rawMessage.payload.text);
  });

  syncConversationState();

  window.setInterval(() => {
    syncConversationState();
  }, 1000);
}

function syncConversationState(): void {
  const adapter = getCurrentAdapter();
  const context = adapter?.getCurrentContext() ?? null;

  if (!context) {
    controller?.stop();
    controller = null;
    lastConversationId = null;
    lastSource = null;
    return;
  }

  if (context.source === lastSource && context.sourceThreadId === lastConversationId) {
    controller?.scan();
    return;
  }

  controller?.stop();
  lastSource = context.source;
  lastConversationId = context.sourceThreadId;
  controller = startMessageCaptureOverlay(adapter);

  void sendRuntimeMessage({
    type: "CHATGPT_THREAD_CHANGED",
    payload: context,
  });
}

function getCurrentAdapter(): MessageCaptureAdapter | null {
  const chatGptContext = chatGptCaptureAdapter.getCurrentContext();

  if (chatGptContext) {
    return chatGptCaptureAdapter;
  }

  const deepWikiContext = deepWikiCaptureAdapter.getCurrentContext();

  return deepWikiContext ? deepWikiCaptureAdapter : null;
}
