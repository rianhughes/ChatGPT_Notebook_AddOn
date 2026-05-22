import { beforeEach, describe, expect, it } from "vitest";

import {
  extractMessageFromContainer,
  extractSelectionFromDocument,
  findVisibleMessageContainers,
  getCurrentChatGptConversation,
} from "../src/content/chatgptDomAdapter";

describe("chatgptDomAdapter", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/c/test-conversation");
    document.title = "Useful chat - ChatGPT";
    document.body.innerHTML = "";
    window.sessionStorage.clear();
  });

  it("extracts role, source ID, thread ID, and normalized text", () => {
    document.body.innerHTML = `
      <main>
        <div data-message-author-role="assistant" data-message-id="msg-1">
          <div class="markdown">
            <p>Hello <strong>world</strong></p>
          </div>
        </div>
      </main>
    `;

    const [container] = findVisibleMessageContainers();
    const extracted = extractMessageFromContainer(container);

    expect(extracted?.sourceThreadId).toBe("test-conversation");
    expect(extracted?.title).toBe("Useful chat");
    expect(extracted?.role).toBe("assistant");
    expect(extracted?.sourceMessageId).toBe("msg-1");
    expect(extracted?.sourceMessageKey).toBe("source:msg-1");
    expect(extracted?.contentText).toBe("Hello world");
  });

  it("preserves code blocks when extracting a full message", () => {
    document.body.innerHTML = `
      <main>
        <div data-message-author-role="assistant" data-message-id="msg-code">
          <div class="markdown">
            <p>Use this:</p>
            <pre data-language="ts"><code class="language-ts">const answer = 42;</code></pre>
          </div>
        </div>
      </main>
    `;

    const [container] = findVisibleMessageContainers();
    const extracted = extractMessageFromContainer(container);

    expect(extracted?.contentMarkdown).toContain("```ts\nconst answer = 42;\n```");
    expect(extracted?.contentText).toContain("const answer = 42;");
  });

  it("preserves anchors as Markdown links when extracting a full message", () => {
    document.body.innerHTML = `
      <main>
        <div data-message-author-role="assistant" data-message-id="msg-link">
          <div class="markdown">
            <p>Read <a href="https://example.com/docs">the docs</a> first.</p>
          </div>
        </div>
      </main>
    `;

    const [container] = findVisibleMessageContainers();
    const extracted = extractMessageFromContainer(container);

    expect(extracted?.contentMarkdown).toBe("Read [the docs](https://example.com/docs) first.");
    expect(extracted?.contentText).toBe("Read the docs first.");
  });

  it("extracts ChatGPT HTML tables as Markdown tables", () => {
    document.body.innerHTML = `
      <main>
        <div data-message-author-role="assistant" data-message-id="msg-table">
          <div class="markdown">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Usefulness of your blockchain-client project</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>Databricks</td>
                  <td>Backend Software Engineer</td>
                  <td>9/10</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>Cohere</td>
                  <td>Software Engineer, Internal Infrastructure</td>
                  <td>9/10</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    `;

    const [container] = findVisibleMessageContainers();
    const extracted = extractMessageFromContainer(container);

    expect(extracted?.contentMarkdown).toBe(
      [
        "| Rank | Company | Role | Usefulness of your blockchain-client project |",
        "| --- | --- | --- | --- |",
        "| 1 | Databricks | Backend Software Engineer | 9/10 |",
        "| 2 | Cohere | Software Engineer, Internal Infrastructure | 9/10 |",
      ].join("\n"),
    );
  });

  it("converts tab-delimited table text into a Markdown table", () => {
    document.body.innerHTML = `
      <main>
        <div data-message-author-role="assistant" data-message-id="msg-tsv-table">
          <div class="markdown">
            <p>Rank\tCompany\tRole\tUsefulness of your blockchain-client project<br>1\tDatabricks\tBackend Software Engineer\t9/10<br>2\tCohere\tSoftware Engineer, Internal Infrastructure\t9/10</p>
          </div>
        </div>
      </main>
    `;

    const [container] = findVisibleMessageContainers();
    const extracted = extractMessageFromContainer(container);

    expect(extracted?.contentMarkdown).toBe(
      [
        "| Rank | Company | Role | Usefulness of your blockchain-client project |",
        "| --- | --- | --- | --- |",
        "| 1 | Databricks | Backend Software Engineer | 9/10 |",
        "| 2 | Cohere | Software Engineer, Internal Infrastructure | 9/10 |",
      ].join("\n"),
    );
  });

  it("preserves visual code block line breaks from nested ChatGPT markup", () => {
    document.body.innerHTML = `
      <main>
        <div data-message-author-role="assistant" data-message-id="msg-flow">
          <div class="markdown">
            <p>The client sends a cancel signal or closes the streaming connection:</p>
            <pre><code><div><span>Client sends query</span></div><div><span>↓</span></div><div><span>Backend starts model generation</span></div><div><span>↓</span></div><div><span>Backend streams partial output</span></div><div><span>↓</span></div><div><span>Client renders tokens as they arrive</span></div></code></pre>
          </div>
        </div>
      </main>
    `;

    const [container] = findVisibleMessageContainers();
    const extracted = extractMessageFromContainer(container);

    expect(extracted?.contentMarkdown).toContain(
      [
        "```",
        "Client sends query",
        "↓",
        "Backend starts model generation",
        "↓",
        "Backend streams partial output",
        "↓",
        "Client renders tokens as they arrive",
        "```",
      ].join("\n"),
    );
  });

  it("falls back to a content-derived source key", () => {
    document.body.innerHTML = `
      <main>
        <div data-message-author-role="user">
          Please save this
        </div>
      </main>
    `;

    const [container] = findVisibleMessageContainers();
    const extracted = extractMessageFromContainer(container);

    expect(extracted?.sourceMessageId).toBeNull();
    expect(extracted?.sourceMessageKey.startsWith("content:")).toBe(true);
  });

  it("creates a temporary thread for unsaved ChatGPT pages without a conversation id", () => {
    window.history.pushState({}, "", "/?utm_source=google");
    document.title = "ChatGPT";
    document.body.innerHTML = `
      <main>
        <div data-message-author-role="assistant" data-message-id="msg-root">
          <div class="markdown">
            <p>Root page response</p>
          </div>
        </div>
      </main>
    `;

    const context = getCurrentChatGptConversation();
    const [container] = findVisibleMessageContainers();
    const extracted = extractMessageFromContainer(container);

    expect(context?.sourceThreadId.startsWith("temporary:")).toBe(true);
    expect(extracted?.sourceThreadId).toBe(context?.sourceThreadId);
    expect(extracted?.contentText).toBe("Root page response");
  });

  it("deduplicates ChatGPT turn wrappers so toolbar controls are not treated as messages", () => {
    document.body.innerHTML = `
      <main>
        <article data-testid="conversation-turn-1">
          <div data-message-author-role="assistant" data-message-id="msg-with-actions">
            <div class="markdown">
              <p>Only this message should be exportable.</p>
            </div>
          </div>
          <div aria-label="Message actions">
            <button type="button" aria-label="Copy">Copy</button>
            <button type="button" aria-label="Regenerate">Regenerate</button>
          </div>
        </article>
      </main>
    `;

    const containers = findVisibleMessageContainers();

    expect(containers).toHaveLength(1);
    expect(containers[0]?.getAttribute("data-message-author-role")).toBe("assistant");
    expect(containers[0]?.getAttribute("data-message-id")).toBe("msg-with-actions");
  });

  it("extracts a selected code fragment as a selection save", () => {
    document.body.innerHTML = `
      <main>
        <div data-message-author-role="assistant" data-message-id="msg-selected-code">
          <div class="markdown">
            <p>Save part of this:</p>
            <pre data-language="js"><code class="language-js">const saved = true;</code></pre>
          </div>
        </div>
      </main>
    `;
    const code = document.querySelector("code") as HTMLElement;
    const range = document.createRange();
    const selection = window.getSelection();

    range.selectNodeContents(code);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const extracted = extractSelectionFromDocument(selection);

    expect(extracted?.sourceMessageKey.startsWith("selection:source:msg-selected-code:")).toBe(true);
    expect(extracted?.contentMarkdown).toBe("```js\nconst saved = true;\n```");
    expect(extracted?.contentText).toBe("const saved = true;");
  });
});
