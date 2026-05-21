import { addRuntimeMessageListener, sendRuntimeMessage } from "../browser/runtime";
import { isExtensionMessage } from "../core/ports";
import { insertTextIntoChatGptComposer } from "./chatgptComposerAdapter";
import { getCurrentChatGptConversation } from "./chatgptDomAdapter";
import { startMessageCaptureOverlay, type OverlayController } from "./messageCaptureOverlay";

let controller: OverlayController | null = null;
let lastConversationId: string | null = null;

bootstrap();

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
  const context = getCurrentChatGptConversation();

  if (!context) {
    controller?.stop();
    controller = null;
    lastConversationId = null;
    return;
  }

  if (context.sourceThreadId === lastConversationId) {
    controller?.scan();
    return;
  }

  controller?.stop();
  lastConversationId = context.sourceThreadId;
  controller = startMessageCaptureOverlay();

  void sendRuntimeMessage({
    type: "CHATGPT_THREAD_CHANGED",
    payload: context,
  });
}
