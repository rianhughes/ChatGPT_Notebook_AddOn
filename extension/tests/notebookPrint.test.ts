import { describe, expect, it } from "vitest";

import type { ChatGptThread, SavedMessage } from "../src/core/models";
import { createNotebookExportData } from "../src/core/notebookExport";
import { createNotebookPrintHtml } from "../src/core/notebookPrint";

describe("notebook print export", () => {
  it("formats a notebook as a printable HTML document", () => {
    const data = createNotebookExportData(
      thread({ title: "Research <Notes>" }),
      [
        message({
          role: "assistant",
          contentMarkdown: [
            "## Plan & Scope",
            "",
            "- Keep **Markdown** readable",
            "- Keep `**literal**` code literal",
            "- Escape <script>alert('x')</script>",
            "",
            "```ts",
            "const ok = value < 3;",
            "```",
          ].join("\n"),
        }),
      ],
      { now: Date.UTC(2026, 4, 21, 9, 30, 0) },
    );

    const html = createNotebookPrintHtml(data);

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("<title>Research &lt;Notes&gt;</title>");
    expect(html).toContain("<h1>Research &lt;Notes&gt;</h1>");
    expect(html).toContain("1 saved message - Exported 2026-05-21T09:30:00.000Z");
    expect(html).toContain("<h3>Plan &amp; Scope</h3>");
    expect(html).toContain("<li>Keep <strong>Markdown</strong> readable</li>");
    expect(html).toContain("<li>Keep <code>**literal**</code> code literal</li>");
    expect(html).toContain("Escape &lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;");
    expect(html).toContain('<pre><code class="language-ts">const ok = value &lt; 3;</code></pre>');
    expect(html).not.toContain("<script>alert");
  });

  it("falls back to plain text content for empty markdown", () => {
    const data = createNotebookExportData(thread(), [message({ contentMarkdown: "", contentText: "Plain text note" })]);

    expect(createNotebookPrintHtml(data)).toContain("<p>Plain text note</p>");
  });

  it("renders Markdown pipe tables as printable HTML tables", () => {
    const data = createNotebookExportData(
      thread(),
      [
        message({
          contentMarkdown: [
            "Here's the query/read path in the same layout.",
            "",
            "| Box | Code location | Role in query path | Main calls / data moved |",
            "| --- | --- | --- | --- |",
            "| Client | external | Sends JSON-RPC request over HTTP or WebSocket. | Example: `starknet_getBlockWithTxs`, `starknet_syncing`, `starknet_call`. |",
            "| Transport Layer | node/http.go | Binds URL paths to HTTP/WS handlers. | Routes `/`, `/rpc`, `/v0_10`, `/v0_9`, `/v0_8`, plus `/ws/...`. |",
          ].join("\n"),
        }),
      ],
    );

    const html = createNotebookPrintHtml(data);

    expect(html).toContain('<div class="notebook-print-table-wrap">');
    expect(html).toContain("<table>");
    expect(html).toContain("<th>Box</th>");
    expect(html).toContain("<td>Transport Layer</td>");
    expect(html).toContain("<code>starknet_getBlockWithTxs</code>");
    expect(html).not.toContain("| Box | Code location |");
  });

  it("renders local source links with a readable label and separated path", () => {
    const data = createNotebookExportData(
      thread(),
      [
        message({
          contentMarkdown:
            "[node/http.go](/home/rian/Desktop/DistributedComputingEtc/juno/node/http.go:100) binds URL paths.",
        }),
      ],
    );

    const html = createNotebookPrintHtml(data);

    expect(html).toContain('<span class="notebook-print-source-link">');
    expect(html).toContain('<span class="notebook-print-source-link-label">node/http.go</span>');
    expect(html).toContain(
      '<span class="notebook-print-source-link-path">/home/rian/Desktop/DistributedComputingEtc/juno/node/http.go:100</span>',
    );
    expect(html).not.toContain("[node/http.go](");
  });

  it("keeps unsafe markdown links as plain labels in print output", () => {
    const data = createNotebookExportData(thread(), [message({ contentMarkdown: "[click me](javascript:evil)" })]);

    const html = createNotebookPrintHtml(data);

    expect(html).toContain("<p>click me</p>");
    expect(html).not.toContain("javascript:evil");
  });
});

function thread(input: Partial<ChatGptThread> = {}): ChatGptThread {
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
    ...input,
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
