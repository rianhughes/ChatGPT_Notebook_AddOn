import type { SaveChatGptMessageInput } from "../core/models";
import type { CapturableThreadSource, SourceContext } from "../core/threadIdentity";

export type ExtractedSourceMessage = SaveChatGptMessageInput & {
  source: CapturableThreadSource;
  container: HTMLElement;
  isStreaming: boolean;
};

export type MessageCaptureLabels = {
  exportMessage: string;
  exportSelection: string;
};

export type MessageCaptureAdapter = {
  source: CapturableThreadSource;
  labels: MessageCaptureLabels;
  supportsAiOperations?: boolean;
  getCurrentContext(): SourceContext | null;
  findConversationRoot(): HTMLElement;
  findVisibleMessageContainers(root?: ParentNode): HTMLElement[];
  extractMessageFromContainer(container: HTMLElement): ExtractedSourceMessage | null;
  extractSelectionFromDocument(selection: Selection | null): ExtractedSourceMessage | null;
};
