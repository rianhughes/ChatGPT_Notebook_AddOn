import { contentHashFromParts, createId } from "./hash";
import { markdownToPlainText } from "./markdown";
import type { AiNotebookOperation, AiOperationPackage } from "./models";
import {
  appendMessage,
  createFolder,
  createNotebook,
  deleteMessage,
  deleteThread,
  getMessagesInOrder,
  mergeMessages,
  moveMessageAfterMessage,
  moveThreadToFolder,
  renameFolder,
  renameThreadTitle,
  updateMessageContent,
} from "./repository";

export type AiOperationApplyResult = {
  appliedCount: number;
  errors: string[];
};

export async function applyAiOperationPackage(
  operationPackage: AiOperationPackage,
): Promise<AiOperationApplyResult> {
  const errors: string[] = [];
  let appliedCount = 0;

  for (const operation of operationPackage.operations) {
    try {
      await applyAiOperation(operation);
      appliedCount += 1;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Could not apply operation.");
    }
  }

  return { appliedCount, errors };
}

async function applyAiOperation(operation: AiNotebookOperation): Promise<void> {
  switch (operation.type) {
    case "create_note": {
      const normalizedMarkdown = normalizeMarkdown(operation.contentMarkdown);
      const contentText = markdownToPlainText(normalizedMarkdown);
      const created = await appendMessage(operation.threadId, {
        sourceMessageId: null,
        sourceMessageKey: createId("ai-note"),
        contentHash: contentHashFromParts({ contentMarkdown: normalizedMarkdown, contentText }),
        role: "note",
        title: operation.title ?? undefined,
        contentMarkdown: normalizedMarkdown,
        contentText,
      });

      if (operation.afterMessageId !== undefined) {
        await moveMessageAfterMessage(operation.threadId, created.id, operation.afterMessageId ?? null);
      }
      return;
    }
    case "update_note":
      await assertExpectedContentHash(operation.threadId, operation.messageId, operation.expectedContentHash);
      await updateMessageContent(
        operation.threadId,
        operation.messageId,
        operation.contentMarkdown,
        operation.title ?? undefined,
      );
      return;
    case "delete_note":
      await assertExpectedContentHash(operation.threadId, operation.messageId, operation.expectedContentHash);
      await deleteMessage(operation.threadId, operation.messageId);
      return;
    case "move_note":
      await moveMessageAfterMessage(operation.threadId, operation.messageId, operation.afterMessageId);
      return;
    case "merge_notes": {
      const merged = await mergeMessages(operation.threadId, operation.messageIds);

      if (!merged) {
        throw new Error("Could not merge notes.");
      }
      return;
    }
    case "create_notebook":
      await createNotebook({ title: operation.title, folderId: operation.folderId ?? null });
      return;
    case "rename_notebook":
      await renameThreadTitle(operation.threadId, operation.title);
      return;
    case "delete_notebook":
      await deleteThread(operation.threadId);
      return;
    case "move_notebook_to_folder":
      await moveThreadToFolder(operation.threadId, operation.folderId);
      return;
    case "create_folder":
      await createFolder({ title: operation.title });
      return;
    case "rename_folder":
      await renameFolder(operation.folderId, operation.title);
      return;
    default:
      throw new Error("Unsupported AI operation.");
  }
}

async function assertExpectedContentHash(
  threadId: string,
  messageId: string,
  expectedContentHash: string | null | undefined,
): Promise<void> {
  if (!expectedContentHash) {
    return;
  }

  const messages = await getMessagesInOrder(threadId);
  const message = messages.find((item) => item.id === messageId);

  if (!message) {
    throw new Error(`Missing note ${messageId}`);
  }

  if (message.contentHash !== expectedContentHash) {
    throw new Error(`Note ${messageId} changed since ChatGPT generated this proposal.`);
  }
}

function normalizeMarkdown(markdown: string): string {
  return markdown.replace(/\r\n/g, "\n").trim();
}
