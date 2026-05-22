import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MarkdownContent } from "../src/sidebar/components/MarkdownContent";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const HEADING_BOUNDARY = "<!-- cgpt-notes-section-boundary:2 -->";
const CHILD_HEADING_BOUNDARY = "<!-- cgpt-notes-section-boundary:3 -->";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("MarkdownContent", () => {
  it("renders inline strong markdown", () => {
    const html = renderToStaticMarkup(
      <MarkdownContent markdown="For example, the user clicks **Stop generating**." />,
    );

    expect(html).toContain("<strong>Stop generating</strong>");
  });

  it("keeps markdown markers inside inline code literal", () => {
    const html = renderToStaticMarkup(<MarkdownContent markdown="Use `**Stop generating**` literally." />);

    expect(html).toContain("<code class=\"markdown-inline-code\">**Stop generating**</code>");
  });

  it("renders Markdown links as clickable anchors", () => {
    const html = renderToStaticMarkup(
      <MarkdownContent markdown="Read [the docs](https://example.com/docs) before shipping." />,
    );

    expect(html).toContain(
      '<a class="markdown-link" href="https://example.com/docs" target="_blank" rel="noreferrer">the docs</a>',
    );
  });

  it("renders bare URLs and autolinks without touching inline code", () => {
    const html = renderToStaticMarkup(
      <MarkdownContent markdown="Open https://example.com, <https://docs.example.com>, not `https://code.example.com`." />,
    );

    expect(html).toContain('<a class="markdown-link" href="https://example.com"');
    expect(html).toContain('<a class="markdown-link" href="https://docs.example.com"');
    expect(html).toContain('<code class="markdown-inline-code">https://code.example.com</code>');
  });

  it("does not render unsafe link protocols", () => {
    const html = renderToStaticMarkup(<MarkdownContent markdown="[click me](javascript:alert(1))" />);

    expect(html).not.toContain("<a ");
    expect(html).toContain("click me");
  });

  it("keeps heading levels available for styling", () => {
    const html = renderToStaticMarkup(<MarkdownContent markdown="## A larger notebook heading" />);

    expect(html).toContain("markdown-heading-level-2");
  });

  it("renders Markdown pipe tables as tables", () => {
    const html = renderToStaticMarkup(
      <MarkdownContent
        markdown={[
          "| Rank | Company | Role | Usefulness |",
          "| --- | --- | --- | --- |",
          "| 1 | Databricks | Backend Software Engineer | 9/10 |",
          "| 2 | Cohere | Software Engineer, Internal Infrastructure | 9/10 |",
        ].join("\n")}
      />,
    );

    expect(html).toContain("<table class=\"markdown-table\">");
    expect(html).toContain("Company");
    expect(html).toContain("Software Engineer, Internal Infrastructure");
  });

  it("saves an inline paragraph edit with Enter and exits edit mode", async () => {
    const host = document.createElement("div");
    const root = createRoot(host);
    const onMarkdownChange = vi.fn();

    await act(() => {
      root.render(
        <MarkdownContent
          markdown={["## Alpha", "", "Original paragraph.", "", "- One", "- Two"].join("\n")}
          onMarkdownChange={onMarkdownChange}
        />,
      );
    });

    const paragraph = host.querySelector<HTMLElement>(".markdown-paragraph");

    await act(() => {
      paragraph?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    });

    const editor = host.querySelector<HTMLTextAreaElement>("textarea[aria-label='Edit paragraph']");

    expect(editor).not.toBeNull();
    expect(editor?.value).toBe("Original paragraph.");

    await act(() => {
      setControlValue(editor!, "Edited paragraph.");
    });

    await act(async () => {
      editor?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      await Promise.resolve();
    });

    expect(onMarkdownChange).toHaveBeenCalledWith(
      ["## Alpha", "", "Edited paragraph.", "", "- One", "- Two"].join("\n"),
    );
    expect(host.querySelector<HTMLTextAreaElement>("textarea[aria-label='Edit paragraph']")).toBeNull();

    await act(() => {
      root.unmount();
    });
  });

  it("saves inline heading, list, and code edits with markdown syntax preserved", async () => {
    const host = document.createElement("div");
    const root = createRoot(host);
    const onMarkdownChange = vi.fn();
    const markdown = ["## Alpha", "", "- One", "- Two", "", "```ts", "const old = true;", "```"].join("\n");

    await act(() => {
      root.render(<MarkdownContent markdown={markdown} onMarkdownChange={onMarkdownChange} />);
    });

    const headingButton = host.querySelector<HTMLButtonElement>(".markdown-heading-button");

    await act(() => {
      headingButton?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    });

    const headingEditor = host.querySelector<HTMLInputElement>("input[aria-label='Edit heading']");

    await act(() => {
      setControlValue(headingEditor!, "Beta");
    });
    await act(async () => {
      headingEditor?.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
      await Promise.resolve();
    });

    expect(onMarkdownChange).toHaveBeenLastCalledWith(
      ["## Beta", "", "- One", "- Two", "", "```ts", "const old = true;", "```"].join("\n"),
    );

    await act(() => {
      root.render(<MarkdownContent markdown={markdown} onMarkdownChange={onMarkdownChange} />);
    });

    const list = host.querySelector<HTMLElement>(".markdown-list");

    await act(() => {
      list?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    });

    const listEditor = host.querySelector<HTMLTextAreaElement>("textarea[aria-label='Edit list']");

    await act(() => {
      setControlValue(listEditor!, "First\nSecond\nThird");
    });
    await act(async () => {
      listEditor?.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
      await Promise.resolve();
    });

    expect(onMarkdownChange).toHaveBeenLastCalledWith(
      ["## Alpha", "", "- First", "- Second", "- Third", "", "```ts", "const old = true;", "```"].join("\n"),
    );

    await act(() => {
      root.render(<MarkdownContent markdown={markdown} onMarkdownChange={onMarkdownChange} />);
    });

    const code = host.querySelector<HTMLElement>(".markdown-code-card");

    await act(() => {
      code?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    });

    const codeEditor = host.querySelector<HTMLTextAreaElement>("textarea[aria-label='Edit code']");

    await act(() => {
      setControlValue(codeEditor!, "const next = true;");
    });
    await act(async () => {
      codeEditor?.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
      await Promise.resolve();
    });

    expect(onMarkdownChange).toHaveBeenLastCalledWith(
      ["## Alpha", "", "- One", "- Two", "", "```ts", "const next = true;", "```"].join("\n"),
    );

    await act(() => {
      root.unmount();
    });
  });

  it("collapses a heading section up to the next peer heading", async () => {
    const host = document.createElement("div");
    const root = createRoot(host);

    await act(() => {
      root.render(
        <MarkdownContent
          markdown={[
            "## Alpha",
            "",
            "Alpha body",
            "",
            "### Nested",
            "",
            "Nested body",
            "",
            "## Beta",
            "",
            "Beta body",
          ].join("\n")}
        />,
      );
    });

    const alphaButton = host.querySelector<HTMLButtonElement>(".markdown-heading-button");

    expect(alphaButton).not.toBeNull();
    expect(host.textContent).toContain("Alpha body");
    expect(host.textContent).toContain("Nested body");
    expect(host.textContent).toContain("Beta body");

    await act(() => {
      alphaButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(alphaButton?.getAttribute("aria-expanded")).toBe("false");
    expect(host.textContent).toContain("Alpha");
    expect(host.textContent).not.toContain("Alpha body");
    expect(host.textContent).not.toContain("Nested body");
    expect(host.textContent).toContain("Beta");
    expect(host.textContent).toContain("Beta body");

    await act(() => {
      root.unmount();
    });
  });

  it("renders hidden heading boundaries without making following text collapsible", async () => {
    const host = document.createElement("div");
    const root = createRoot(host);

    await act(() => {
      root.render(<MarkdownContent markdown={["## Empty", "", HEADING_BOUNDARY, "", "Outside body"].join("\n")} />);
    });

    expect(host.textContent).toContain("Empty");
    expect(host.textContent).toContain("Outside body");
    expect(host.textContent).not.toContain("cgpt-notes-section-boundary");
    expect(host.querySelector(".markdown-heading-button")).toBeNull();

    await act(() => {
      root.unmount();
    });
  });

  it("collapses only moved content before a hidden heading boundary", async () => {
    const host = document.createElement("div");
    const root = createRoot(host);

    await act(() => {
      root.render(
        <MarkdownContent
          markdown={["## Target", "", "Moved body", "", HEADING_BOUNDARY, "", "Outside body"].join("\n")}
        />,
      );
    });

    const targetButton = host.querySelector<HTMLButtonElement>(".markdown-heading-button");

    expect(targetButton).not.toBeNull();
    expect(host.textContent).toContain("Moved body");
    expect(host.textContent).toContain("Outside body");

    await act(() => {
      targetButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(targetButton?.getAttribute("aria-expanded")).toBe("false");
    expect(host.textContent).not.toContain("Moved body");
    expect(host.textContent).toContain("Outside body");

    await act(() => {
      root.unmount();
    });
  });

  it("keeps parent collapse active across a child heading boundary", async () => {
    const host = document.createElement("div");
    const root = createRoot(host);

    await act(() => {
      root.render(
        <MarkdownContent
          markdown={[
            "## Parent",
            "",
            "Parent intro",
            "",
            "### Child",
            "",
            "Child body",
            "",
            CHILD_HEADING_BOUNDARY,
            "",
            "Parent outro",
          ].join("\n")}
        />,
      );
    });

    const parentButton = host.querySelector<HTMLButtonElement>(".markdown-heading-button");

    expect(parentButton).not.toBeNull();
    expect(host.textContent).toContain("Parent outro");

    await act(() => {
      parentButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(parentButton?.getAttribute("aria-expanded")).toBe("false");
    expect(host.textContent).not.toContain("Parent intro");
    expect(host.textContent).not.toContain("Child body");
    expect(host.textContent).not.toContain("Parent outro");

    await act(() => {
      root.unmount();
    });
  });

  it("marks a selected collapsible heading and reports its source index", async () => {
    const host = document.createElement("div");
    const root = createRoot(host);
    const onSelectHeadingSection = vi.fn();
    const markdown = ["## Alpha", "", "Alpha body", "", "## Beta", "", "Beta body"].join("\n");

    await act(() => {
      root.render(<MarkdownContent markdown={markdown} onSelectHeadingSection={onSelectHeadingSection} />);
    });

    const headingButtons = host.querySelectorAll<HTMLButtonElement>(".markdown-heading-button");

    await act(() => {
      headingButtons[1]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onSelectHeadingSection).toHaveBeenCalledWith(1);

    await act(() => {
      root.render(<MarkdownContent markdown={markdown} selectedHeadingIndex={1} />);
    });

    const headings = host.querySelectorAll<HTMLElement>(".markdown-heading");
    expect(headings[0]?.classList.contains("is-selected")).toBe(false);
    expect(headings[1]?.classList.contains("is-selected")).toBe(true);

    await act(() => {
      root.unmount();
    });
  });

  it("renders headings without floating anchors", async () => {
    const host = document.createElement("div");
    const root = createRoot(host);

    await act(() => {
      root.render(<MarkdownContent markdown={["## Alpha", "", "Alpha body"].join("\n")} />);
    });

    const anchor = host.querySelector<HTMLElement>(".markdown-heading-anchor");
    const alphaButton = host.querySelector<HTMLButtonElement>(".markdown-heading-button");

    expect(anchor).toBeNull();
    expect(alphaButton).not.toBeNull();

    await act(() => {
      alphaButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(alphaButton?.getAttribute("aria-expanded")).toBe("false");
    expect(host.textContent).not.toContain("Alpha body");

    await act(() => {
      root.unmount();
    });
  });

  it("calls section delete with the heading source index", async () => {
    const host = document.createElement("div");
    const root = createRoot(host);
    const onDeleteSection = vi.fn();

    await act(() => {
      root.render(
        <MarkdownContent
          markdown={["## Alpha", "", "Alpha body", "", "## Beta", "", "Beta body"].join("\n")}
          onDeleteSection={onDeleteSection}
        />,
      );
    });

    const deleteButtons = host.querySelectorAll<HTMLButtonElement>(".markdown-heading-delete-button");

    await act(() => {
      deleteButtons[1]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onDeleteSection).toHaveBeenCalledWith(1);

    await act(() => {
      root.unmount();
    });
  });

  it("calls section insert with the heading source index without collapsing", async () => {
    const host = document.createElement("div");
    const root = createRoot(host);
    const onInsertSection = vi.fn();

    await act(() => {
      root.render(
        <MarkdownContent
          markdown={["## Alpha", "", "Alpha body", "", "## Beta", "", "Beta body"].join("\n")}
          onInsertSection={onInsertSection}
        />,
      );
    });

    const alphaButton = host.querySelector<HTMLButtonElement>(".markdown-heading-button");
    const insertButtons = host.querySelectorAll<HTMLButtonElement>(".markdown-heading-insert-button");

    await act(() => {
      insertButtons[1]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onInsertSection).toHaveBeenCalledWith(1);
    expect(alphaButton?.getAttribute("aria-expanded")).toBe("true");
    expect(host.textContent).toContain("Alpha body");

    await act(() => {
      root.unmount();
    });
  });

  it("collapses all collapsible headings when requested", async () => {
    const host = document.createElement("div");
    const root = createRoot(host);
    const markdown = ["## Alpha", "", "Alpha body", "", "## Beta", "", "Beta body"].join("\n");

    await act(() => {
      root.render(<MarkdownContent markdown={markdown} collapseAllHeadings />);
    });

    const headingButtons = host.querySelectorAll<HTMLButtonElement>(".markdown-heading-button");

    expect(headingButtons[0]?.getAttribute("aria-expanded")).toBe("false");
    expect(headingButtons[1]?.getAttribute("aria-expanded")).toBe("false");
    expect(host.textContent).toContain("Alpha");
    expect(host.textContent).not.toContain("Alpha body");
    expect(host.textContent).toContain("Beta");
    expect(host.textContent).not.toContain("Beta body");

    await act(() => {
      root.render(<MarkdownContent markdown={markdown} collapseAllHeadings={false} />);
    });

    expect(host.textContent).toContain("Alpha body");
    expect(host.textContent).toContain("Beta body");

    await act(() => {
      root.unmount();
    });
  });

  it("keeps a manually expanded section open when markdown changes under collapse all", async () => {
    const host = document.createElement("div");
    const root = createRoot(host);
    const markdown = ["## Alpha", "", "Alpha body", "", "## Beta", "", "Beta body"].join("\n");

    await act(() => {
      root.render(<MarkdownContent markdown={markdown} collapseAllHeadings />);
    });

    const alphaButton = host.querySelector<HTMLButtonElement>(".markdown-heading-button");

    await act(() => {
      alphaButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(alphaButton?.getAttribute("aria-expanded")).toBe("true");
    expect(host.textContent).toContain("Alpha body");

    await act(() => {
      root.render(
        <MarkdownContent
          markdown={["## Alpha", "", "Alpha body after cut", "", "## Beta", "", "Beta body"].join("\n")}
          collapseAllHeadings
        />,
      );
    });

    expect(host.querySelector<HTMLButtonElement>(".markdown-heading-button")?.getAttribute("aria-expanded")).toBe(
      "true",
    );
    expect(host.textContent).toContain("Alpha body after cut");

    await act(() => {
      root.unmount();
    });
  });
});

function setControlValue(control: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(control), "value")?.set;
  valueSetter?.call(control, value);
  control.dispatchEvent(new Event("input", { bubbles: true }));
}
