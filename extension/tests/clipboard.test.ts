import { afterEach, describe, expect, it, vi } from "vitest";

import { copyText } from "../src/core/clipboard";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("copyText", () => {
  it("restores the previous selection after using the textarea fallback", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: execCommand,
    });
    const host = document.createElement("div");
    host.textContent = "selected note text";
    document.body.append(host);

    const range = document.createRange();
    range.selectNodeContents(host);
    document.getSelection()?.removeAllRanges();
    document.getSelection()?.addRange(range);

    await copyText("copied text");

    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(document.querySelector("textarea")).toBeNull();
    expect(document.getSelection()?.toString()).toBe("selected note text");

    host.remove();
  });
});
