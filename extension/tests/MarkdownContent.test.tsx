import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MarkdownContent } from "../src/sidebar/components/MarkdownContent";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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

  it("keeps heading levels available for styling", () => {
    const html = renderToStaticMarkup(<MarkdownContent markdown="## A larger notebook heading" />);

    expect(html).toContain("markdown-heading-level-2");
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

  it("jumps a floating heading back to its starting position instead of toggling", async () => {
    const host = document.createElement("div");
    const root = createRoot(host);
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);

    Object.defineProperty(window, "scrollY", { value: 120, configurable: true });

    await act(() => {
      root.render(<MarkdownContent markdown={["## Alpha", "", "Alpha body"].join("\n")} />);
    });

    const heading = host.querySelector<HTMLElement>(".markdown-heading");
    const anchor = host.querySelector<HTMLElement>(".markdown-heading-anchor");
    const alphaButton = host.querySelector<HTMLButtonElement>(".markdown-heading-button");

    expect(heading).not.toBeNull();
    expect(anchor).not.toBeNull();
    expect(alphaButton).not.toBeNull();

    heading!.style.top = "10px";
    vi.spyOn(heading!, "getBoundingClientRect").mockReturnValue(getRect({ top: 10 }));
    vi.spyOn(anchor!, "getBoundingClientRect").mockReturnValue(getRect({ top: -30 }));

    await act(() => {
      alphaButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(alphaButton?.getAttribute("aria-expanded")).toBe("true");
    expect(host.textContent).toContain("Alpha body");
    expect(scrollTo).toHaveBeenCalledWith({ top: 80, behavior: "auto" });

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

function getRect(rect: Partial<DOMRect>): DOMRect {
  return {
    x: rect.x ?? rect.left ?? 0,
    y: rect.y ?? rect.top ?? 0,
    width: rect.width ?? 0,
    height: rect.height ?? 0,
    top: rect.top ?? 0,
    right: rect.right ?? 0,
    bottom: rect.bottom ?? 0,
    left: rect.left ?? 0,
    toJSON: () => ({}),
  };
}
