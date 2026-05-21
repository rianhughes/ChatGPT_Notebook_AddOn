import { beforeEach, describe, expect, it, vi } from "vitest";

const mockExtensionApi = vi.hoisted(() => ({
  browser: {} as {
    scripting?: {
      executeScript?: ReturnType<typeof vi.fn>;
      insertCSS?: ReturnType<typeof vi.fn>;
    };
  },
}));

vi.mock("../src/browser/extensionApi", () => ({
  default: mockExtensionApi.browser,
}));

describe("browser tabs helpers", () => {
  beforeEach(() => {
    mockExtensionApi.browser.scripting = undefined;
  });

  it("injects the ChatGPT content script and stylesheet into ChatGPT tabs", async () => {
    const executeScript = vi.fn().mockResolvedValue(undefined);
    const insertCSS = vi.fn().mockResolvedValue(undefined);
    mockExtensionApi.browser.scripting = { executeScript, insertCSS };
    const { ensureChatGptContentScript } = await import("../src/browser/tabs");

    await ensureChatGptContentScript({
      id: 42,
      url: "https://chatgpt.com/c/test-conversation",
    });

    expect(insertCSS).toHaveBeenCalledWith({
      target: { tabId: 42 },
      files: ["injected.css"],
    });
    expect(executeScript).toHaveBeenCalledWith({
      target: { tabId: 42 },
      files: ["content.js"],
    });
  });

  it("does not inject into non-ChatGPT tabs", async () => {
    const executeScript = vi.fn().mockResolvedValue(undefined);
    const insertCSS = vi.fn().mockResolvedValue(undefined);
    mockExtensionApi.browser.scripting = { executeScript, insertCSS };
    const { ensureChatGptContentScript } = await import("../src/browser/tabs");

    await ensureChatGptContentScript({
      id: 42,
      url: "https://example.com/",
    });

    expect(insertCSS).not.toHaveBeenCalled();
    expect(executeScript).not.toHaveBeenCalled();
  });

  it("still injects the script when stylesheet injection is already handled", async () => {
    const executeScript = vi.fn().mockResolvedValue(undefined);
    const insertCSS = vi.fn().mockRejectedValue(new Error("already inserted"));
    mockExtensionApi.browser.scripting = { executeScript, insertCSS };
    const { ensureChatGptContentScript } = await import("../src/browser/tabs");

    await ensureChatGptContentScript({
      id: 42,
      url: "https://chatgpt.com/c/test-conversation",
    });

    expect(executeScript).toHaveBeenCalledWith({
      target: { tabId: 42 },
      files: ["content.js"],
    });
  });
});
