import { beforeEach, describe, expect, it } from "vitest";

import {
  applyAiOperationPackage,
} from "../src/core/aiOperations";
import {
  parseAiOperationPackagesFromMarkdown,
} from "../src/core/aiOperationProtocol";
import {
  appendMessage,
  createNotebook,
  getMessagesInOrder,
  getThread,
} from "../src/core/repository";
import { contentHashFromParts } from "../src/core/hash";
import { markdownToPlainText } from "../src/core/markdown";
import { resetDatabaseForTests } from "../src/storage/db";

describe("aiOperations", () => {
  beforeEach(async () => {
    await resetDatabaseForTests();
  });

  it("parses cgpt-notes-ops blocks and applies note updates", async () => {
    const notebook = await createNotebook({ title: "AI notes" });
    const note = await appendNote(notebook.id, "Original body");
    const [operationPackage] = parseAiOperationPackagesFromMarkdown(
      [
        "Here are the changes:",
        "",
        "```cgpt-notes-ops",
        JSON.stringify({
          protocolVersion: 1,
          operations: [
            {
              type: "update_note",
              threadId: notebook.id,
              messageId: note.id,
              expectedContentHash: note.contentHash,
              contentMarkdown: "## Better body\n\nUpdated by ChatGPT.",
            },
          ],
        }),
        "```",
      ].join("\n"),
      { sourceThreadId: "conversation", sourceTitle: "Conversation" },
    );

    expect(operationPackage.operations).toHaveLength(1);

    const result = await applyAiOperationPackage(operationPackage);
    const messages = await getMessagesInOrder(notebook.id);

    expect(result).toEqual({ appliedCount: 1, errors: [] });
    expect(messages[0].contentMarkdown).toBe("## Better body\n\nUpdated by ChatGPT.");
    expect(messages[0].contentText).toBe("Better body Updated by ChatGPT.");
  });

  it("blocks stale note updates when an expected hash no longer matches", async () => {
    const notebook = await createNotebook({ title: "AI notes" });
    const note = await appendNote(notebook.id, "Original body");

    await applyAiOperationPackage({
      protocolVersion: 1,
      requestId: "first-edit",
      sourceThreadId: "conversation",
      sourceTitle: "Conversation",
      operations: [
        {
          type: "update_note",
          threadId: notebook.id,
          messageId: note.id,
          contentMarkdown: "Changed elsewhere",
        },
      ],
    });

    const result = await applyAiOperationPackage({
      protocolVersion: 1,
      requestId: "stale-edit",
      sourceThreadId: "conversation",
      sourceTitle: "Conversation",
      operations: [
        {
          type: "update_note",
          threadId: notebook.id,
          messageId: note.id,
          expectedContentHash: note.contentHash,
          contentMarkdown: "Should not apply",
        },
      ],
    });
    const messages = await getMessagesInOrder(notebook.id);

    expect(result.appliedCount).toBe(0);
    expect(result.errors[0]).toContain("changed since ChatGPT generated this proposal");
    expect(messages[0].contentMarkdown).toBe("Changed elsewhere");
  });

  it("applies notebook-level operations through repository writes", async () => {
    const notebook = await createNotebook({ title: "Old title" });

    const result = await applyAiOperationPackage({
      protocolVersion: 1,
      requestId: "rename",
      sourceThreadId: "conversation",
      sourceTitle: "Conversation",
      operations: [
        {
          type: "rename_notebook",
          threadId: notebook.id,
          title: "New title",
        },
      ],
    });

    expect(result).toEqual({ appliedCount: 1, errors: [] });
    expect((await getThread(notebook.id))?.title).toBe("New title");
  });
});

async function appendNote(threadId: string, contentMarkdown: string) {
  const contentText = markdownToPlainText(contentMarkdown);

  return appendMessage(threadId, {
    sourceMessageId: null,
    sourceMessageKey: `test-note:${contentMarkdown}`,
    contentHash: contentHashFromParts({ contentMarkdown, contentText }),
    role: "note",
    contentMarkdown,
    contentText,
  });
}
