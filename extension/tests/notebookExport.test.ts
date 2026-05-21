import { describe, expect, it } from "vitest";

import type { ChatGptThread, SavedMessage } from "../src/core/models";
import {
  createNotebookExportData,
  createNotebookExportFile,
  NOTEBOOK_EXPORT_FORMATTERS,
} from "../src/core/notebookExport";

describe("notebook export", () => {
  it("formats a notebook as Markdown with frontmatter and ordered messages", () => {
    const data = createNotebookExportData(
      thread(),
      [
        message({ id: "m1", role: "user", contentMarkdown: "Question?" }),
        message({
          id: "m2",
          role: "assistant",
          contentMarkdown: ["Answer:", "", "```ts", "const ok = true;", "```"].join("\n"),
        }),
      ],
      { now: Date.UTC(2026, 4, 21, 9, 30, 0) },
    );
    const file = createNotebookExportFile(data, "markdown");

    expect(file.filename).toBe("research-notes-2026-05-21.md");
    expect(file.mimeType).toBe("text/markdown");
    expect(file.contents).toContain('app: "chatgpt-notes-sidebar"');
    expect(file.contents).toContain('title: "Research Notes"');
    expect(file.contents).toContain("## User - 2026-05-21T08:00:00.000Z\n\nQuestion?");
    expect(file.contents).toContain("## Assistant - 2026-05-21T08:00:00.000Z\n\nAnswer:");
    expect(file.contents).toContain("```ts\nconst ok = true;\n```");
  });

  it("formats a notebook as versioned JSON without linked-list pointers", () => {
    const data = createNotebookExportData(thread(), [message({ id: "m1", contentMarkdown: "" })], {
      now: Date.UTC(2026, 4, 21, 9, 30, 0),
    });
    const file = createNotebookExportFile(data, "json");
    const parsed = JSON.parse(file.contents);

    expect(file.filename).toBe("research-notes-2026-05-21.json");
    expect(file.mimeType).toBe("application/json");
    expect(parsed).toMatchObject({
      app: "chatgpt-notes-sidebar",
      exportVersion: 1,
      exportedAt: "2026-05-21T09:30:00.000Z",
      thread: {
        title: "Research Notes",
        messageCount: 1,
      },
      messages: [
        {
          id: "m1",
          position: 0,
          contentMarkdown: "",
          contentText: "Fallback text",
        },
      ],
    });
    expect(parsed.messages[0]).not.toHaveProperty("prevId");
    expect(parsed.messages[0]).not.toHaveProperty("nextId");
  });

  it("keeps export formats in a registry for the toolbar", () => {
    expect(NOTEBOOK_EXPORT_FORMATTERS.map((format) => format.id)).toEqual(["markdown", "json"]);
  });
});

function thread(): ChatGptThread {
  return {
    id: "thread-1",
    source: "chatgpt",
    sourceThreadId: "conversation-1",
    title: "Research Notes",
    headMessageId: "m1",
    tailMessageId: "m2",
    messageCount: 2,
    createdAt: Date.UTC(2026, 4, 20, 8, 0, 0),
    updatedAt: Date.UTC(2026, 4, 21, 8, 0, 0),
  };
}

function message(input: Partial<SavedMessage>): SavedMessage {
  return {
    id: "message",
    threadId: "thread-1",
    sourceMessageId: "source-message",
    sourceMessageKey: "source-key",
    contentHash: "hash",
    role: "assistant",
    contentMarkdown: "Markdown",
    contentText: "Fallback text",
    prevId: null,
    nextId: null,
    createdAt: Date.UTC(2026, 4, 21, 8, 0, 0),
    updatedAt: Date.UTC(2026, 4, 21, 8, 0, 0),
    ...input,
  };
}
