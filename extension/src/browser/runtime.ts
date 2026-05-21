import browser from "./extensionApi";
import type { ExtensionMessage } from "../core/ports";

export function sendRuntimeMessage<TResponse>(message: ExtensionMessage): Promise<TResponse> {
  return browser.runtime.sendMessage(message) as Promise<TResponse>;
}

export function addRuntimeMessageListener(
  handler: (
    message: unknown,
    sender: browser.Runtime.MessageSender,
  ) => Promise<unknown> | unknown,
): () => void {
  browser.runtime.onMessage.addListener(handler);
  return () => browser.runtime.onMessage.removeListener(handler);
}
