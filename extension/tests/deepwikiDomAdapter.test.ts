// @vitest-environment-options {"url":"https://deepwiki.com/NethermindEth/juno/4.2-rpc-system"}

import { beforeEach, describe, expect, it } from "vitest";

import {
  extractMessageFromContainer,
  extractSelectionFromDocument,
  findVisibleMessageContainers,
  getCurrentDeepWikiContext,
} from "../src/content/deepwikiDomAdapter";

describe("deepwikiDomAdapter", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/NethermindEth/juno/4.2-rpc-system");
    document.title = "RPC System | DeepWiki";
    document.body.innerHTML = "";
  });

  it("extracts DeepWiki repo context and a heading section as Markdown", () => {
    document.body.innerHTML = `
      <main id="codebase-wiki-repo-page">
        <div class="prose-custom">
          <h1 id="rpc-system" data-header="true">RPC System</h1>
          <p>The RPC system supports multiple API versions.</p>
          <h2 id="request-flow" data-header="true">Request Flow</h2>
          <ol>
            <li><strong>Transport Layer</strong> receives the request.</li>
            <li><strong>HTTP Service Layer</strong> routes by URL path.</li>
          </ol>
          <h2 id="notes" data-header="true">Notes</h2>
          <p>Other notes.</p>
        </div>
      </main>
    `;

    const context = getCurrentDeepWikiContext();
    const containers = findVisibleMessageContainers();
    const extracted = extractMessageFromContainer(containers[1]);

    expect(context).toMatchObject({
      source: "deepwiki",
      sourceThreadId: "deepwiki:NethermindEth/juno",
      title: "RPC System",
    });
    expect(containers.map((container) => container.id)).toEqual(["rpc-system", "request-flow", "notes"]);
    expect(extracted?.source).toBe("deepwiki");
    expect(extracted?.sourceMessageId).toBe("deepwiki:NethermindEth/juno:4.2-rpc-system#request-flow");
    expect(extracted?.sourceMessageKey).toBe("source:deepwiki:NethermindEth/juno:4.2-rpc-system#request-flow");
    expect(extracted?.contentMarkdown).toContain("## Request Flow");
    expect(extracted?.contentMarkdown).toContain("- **Transport Layer** receives the request.");
    expect(extracted?.contentMarkdown).not.toContain("Other notes");
  });

  it("moves DeepWiki file citations out of prose", () => {
    document.body.innerHTML = `
      <main id="codebase-wiki-repo-page">
        <div class="prose-custom">
          <h2 id="sync-layer" data-header="true">1. Synchronizer Layer</h2>
          <p>
            The <code>Synchronizer</code> in <code>sync/sync.go</code> orchestrates block ingestion
            <a href="/NethermindEth/juno/source/sync.go#L116-L153">sync.go:116-153</a>.
            It coordinates storage
            <a href="/NethermindEth/juno/source/sync.go#L297-L381">sync.go:297-381</a>.
          </p>
        </div>
      </main>
    `;

    const [container] = findVisibleMessageContainers();
    const extracted = extractMessageFromContainer(container);

    expect(extracted?.contentMarkdown).toContain(
      "The `Synchronizer` in `sync/sync.go` orchestrates block ingestion. It coordinates storage.",
    );
    expect(extracted?.contentMarkdown).toContain("**Sources:** sync.go:116-153, sync.go:297-381");
  });

  it("supports DeepWiki search answer pages", () => {
    window.history.pushState(
      {},
      "",
      "/search/i-want-to-understand-all-the-layers_12332165-f81e-40a9-88b2-15d4a79e098f?mode=fast",
    );
    document.body.innerHTML = `
      <main>
        <article>
          <h2>Read path</h2>
          <p>Transport Layer receives request and passes to HTTP Service.</p>
        </article>
      </main>
    `;

    const context = getCurrentDeepWikiContext();
    const [container] = findVisibleMessageContainers();
    const extracted = extractMessageFromContainer(container);

    expect(context?.sourceThreadId).toBe(
      "deepwiki:search:i-want-to-understand-all-the-layers_12332165-f81e-40a9-88b2-15d4a79e098f",
    );
    expect(context?.title).toBe("Read path");
    expect(extracted?.contentText).toContain("Transport Layer receives request");
  });

  it("finds visible DeepWiki search answer sections in plain layout containers", () => {
    window.history.pushState(
      {},
      "",
      "/search/i-want-to-understand-all-the-layers_12332165-f81e-40a9-88b2-15d4a79e098f?mode=fast",
    );
    document.body.innerHTML = `
      <header>
        <h1>DeepWiki</h1>
        <button>Share</button>
      </header>
      <main>
        <div class="layout-shell">
          <aside><h2>Navigation</h2></aside>
          <section>
            <ol>
              <li><strong>Transport Layer</strong> receives request and passes to HTTP Service</li>
              <li><strong>HTTP Service Layer</strong> routes based on URL path <a href="http.go:99-106">http.go:99-106</a></li>
            </ol>
            <h2>Notes</h2>
            <p>The RPC system supports multiple API versions simultaneously.</p>
          </section>
          <form>
            <textarea>Ask a follow-up question</textarea>
            <button>Share</button>
          </form>
        </div>
      </main>
    `;

    const containers = findVisibleMessageContainers();
    const extracted = extractMessageFromContainer(containers[0]);

    expect(containers.map((container) => container.tagName)).toEqual(["SECTION", "H2"]);
    expect(extracted?.contentMarkdown).toContain("## Notes");
    expect(extracted?.contentMarkdown).toContain("- **Transport Layer** receives request");
    expect(extracted?.contentMarkdown).toContain("The RPC system supports multiple API versions simultaneously.");
    expect(extracted?.contentMarkdown).not.toContain("Ask a follow-up question");
  });

  it("ignores hidden server-rendered DeepWiki payloads", () => {
    document.body.innerHTML = `
      <div hidden>
        <div class="prose-custom">
          <h1 id="hidden" data-header="true">Hidden duplicate</h1>
        </div>
      </div>
      <main>
        <div class="prose-custom">
          <h1 id="visible" data-header="true">Visible page</h1>
        </div>
      </main>
    `;

    expect(findVisibleMessageContainers().map((container) => container.id)).toEqual(["visible"]);
  });

  it("extracts selected text from the current DeepWiki section", () => {
    document.body.innerHTML = `
      <main>
        <article>
          <h2 id="request-flow" data-header="true">Request Flow</h2>
          <p>Client sends HTTP POST to a specific path.</p>
        </article>
      </main>
    `;
    const paragraph = document.querySelector("p") as HTMLElement;
    const range = document.createRange();
    const selection = window.getSelection();

    range.selectNodeContents(paragraph);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const extracted = extractSelectionFromDocument(selection);

    expect(extracted?.sourceMessageKey.startsWith("selection:source:deepwiki:NethermindEth/juno:")).toBe(true);
    expect(extracted?.contentMarkdown).toBe("Client sends HTTP POST to a specific path.");
  });

  it("extracts highlighted search text outside the chosen answer root", () => {
    window.history.pushState(
      {},
      "",
      "/search/i-want-to-understand-all-the-layers_12332165-f81e-40a9-88b2-15d4a79e098f?mode=fast",
    );
    document.body.innerHTML = `
      <main>
        <section>
          <h2>2. Data Fetching Layer</h2>
          <p>The StarknetData interface defines methods for fetching blockchain data.</p>
        </section>
        <section>
          <h2>Notes</h2>
          <p>The RPC system supports multiple API versions simultaneously.</p>
        </section>
      </main>
    `;
    const dataFetchingSection = document.querySelector("section") as HTMLElement;
    const range = document.createRange();
    const selection = window.getSelection();

    range.selectNodeContents(dataFetchingSection);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const extracted = extractSelectionFromDocument(selection);

    expect(extracted?.contentMarkdown).toContain("## 2. Data Fetching Layer");
    expect(extracted?.contentMarkdown).toContain("The StarknetData interface defines methods");
    expect(extracted?.contentMarkdown).not.toContain("multiple API versions");
  });
});
