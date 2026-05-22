import { createId } from "./hash";
import type { AiNotebookOperation, AiOperationPackage } from "./models";

export const AI_OPERATIONS_BLOCK_LANGUAGE = "cgpt-notes-ops";
export const MAX_AI_OPERATION_COUNT = 30;
export const MAX_AI_OPERATION_MARKDOWN_LENGTH = 80_000;

type PackageContext = {
  sourceThreadId: string;
  sourceTitle: string;
};

export function parseAiOperationPackagesFromMarkdown(
  markdown: string,
  context: PackageContext,
): AiOperationPackage[] {
  return extractAiOperationBlocks(markdown)
    .map((block) => parseAiOperationPackageText(block, context))
    .filter((item): item is AiOperationPackage => item !== null);
}

export function parseAiOperationPackageText(
  text: string,
  context: PackageContext,
): AiOperationPackage | null {
  try {
    return normalizeAiOperationPackage(JSON.parse(text), context);
  } catch {
    return null;
  }
}

export function summarizeAiOperation(operation: AiNotebookOperation): string {
  switch (operation.type) {
    case "create_note":
      return `Create note in ${operation.threadId}`;
    case "update_note":
      return `Update note ${operation.messageId}`;
    case "delete_note":
      return `Delete note ${operation.messageId}`;
    case "move_note":
      return `Move note ${operation.messageId}`;
    case "merge_notes":
      return `Merge ${operation.messageIds.length} notes`;
    case "create_notebook":
      return `Create notebook "${operation.title}"`;
    case "rename_notebook":
      return `Rename notebook ${operation.threadId}`;
    case "delete_notebook":
      return `Delete notebook ${operation.threadId}`;
    case "move_notebook_to_folder":
      return `Move notebook ${operation.threadId}`;
    case "create_folder":
      return `Create folder "${operation.title}"`;
    case "rename_folder":
      return `Rename folder ${operation.folderId}`;
    default:
      return "Unknown operation";
  }
}

function extractAiOperationBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  const pattern = /```([^\n`]*)\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null = pattern.exec(markdown);

  while (match) {
    if (match[1].trim().toLowerCase() === AI_OPERATIONS_BLOCK_LANGUAGE) {
      blocks.push(match[2].trim());
    }

    match = pattern.exec(markdown);
  }

  return blocks;
}

function normalizeAiOperationPackage(value: unknown, context: PackageContext): AiOperationPackage | null {
  if (!isRecord(value)) {
    return null;
  }

  const operations = Array.isArray(value.operations)
    ? value.operations.map(normalizeAiOperation).filter((operation): operation is AiNotebookOperation => Boolean(operation))
    : [];

  if (operations.length === 0 || operations.length > MAX_AI_OPERATION_COUNT) {
    return null;
  }

  return {
    protocolVersion: 1,
    requestId: typeof value.requestId === "string" && value.requestId.trim() ? value.requestId.trim() : createId("ai-request"),
    sourceThreadId: getString(value.sourceThreadId) ?? context.sourceThreadId,
    sourceTitle: getString(value.sourceTitle) ?? context.sourceTitle,
    operations,
  };
}

function normalizeAiOperation(value: unknown): AiNotebookOperation | null {
  if (!isRecord(value) || typeof value.type !== "string") {
    return null;
  }

  switch (value.type) {
    case "create_note": {
      const threadId = getString(value.threadId);
      const contentMarkdown = getMarkdown(value.contentMarkdown);

      if (!threadId || contentMarkdown === null) {
        return null;
      }

      return {
        type: "create_note",
        threadId,
        contentMarkdown,
        title: getNullableString(value.title),
        ...(value.afterMessageId === undefined
          ? {}
          : { afterMessageId: getNullableString(value.afterMessageId) }),
      };
    }
    case "update_note": {
      const threadId = getString(value.threadId);
      const messageId = getString(value.messageId);
      const contentMarkdown = getMarkdown(value.contentMarkdown);

      return threadId && messageId && contentMarkdown !== null
        ? {
            type: "update_note",
            threadId,
            messageId,
            contentMarkdown,
            title: getNullableString(value.title),
            expectedContentHash: getNullableString(value.expectedContentHash),
          }
        : null;
    }
    case "delete_note": {
      const threadId = getString(value.threadId);
      const messageId = getString(value.messageId);

      return threadId && messageId
        ? {
            type: "delete_note",
            threadId,
            messageId,
            expectedContentHash: getNullableString(value.expectedContentHash),
          }
        : null;
    }
    case "move_note": {
      const threadId = getString(value.threadId);
      const messageId = getString(value.messageId);
      const afterMessageId = getNullableString(value.afterMessageId);

      return threadId && messageId ? { type: "move_note", threadId, messageId, afterMessageId } : null;
    }
    case "merge_notes": {
      const threadId = getString(value.threadId);
      const messageIds = getStringArray(value.messageIds);

      return threadId && messageIds.length >= 2 ? { type: "merge_notes", threadId, messageIds } : null;
    }
    case "create_notebook": {
      const title = getString(value.title);

      return title ? { type: "create_notebook", title, folderId: getNullableString(value.folderId) } : null;
    }
    case "rename_notebook": {
      const threadId = getString(value.threadId);
      const title = getString(value.title);

      return threadId && title ? { type: "rename_notebook", threadId, title } : null;
    }
    case "delete_notebook": {
      const threadId = getString(value.threadId);

      return threadId ? { type: "delete_notebook", threadId } : null;
    }
    case "move_notebook_to_folder": {
      const threadId = getString(value.threadId);

      return threadId ? { type: "move_notebook_to_folder", threadId, folderId: getNullableString(value.folderId) } : null;
    }
    case "create_folder": {
      const title = getString(value.title);

      return title ? { type: "create_folder", title } : null;
    }
    case "rename_folder": {
      const folderId = getString(value.folderId);
      const title = getString(value.title);

      return folderId && title ? { type: "rename_folder", folderId, title } : null;
    }
    default:
      return null;
  }
}

function normalizeMarkdown(markdown: string): string {
  return markdown.replace(/\r\n/g, "\n").trim();
}

function getMarkdown(value: unknown): string | null {
  if (typeof value !== "string" || value.length > MAX_AI_OPERATION_MARKDOWN_LENGTH) {
    return null;
  }

  return normalizeMarkdown(value);
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getNullableString(value: unknown): string | null {
  return value === null || value === undefined ? null : getString(value);
}

function getStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim())
    : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
