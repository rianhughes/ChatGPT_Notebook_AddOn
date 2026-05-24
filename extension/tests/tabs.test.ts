import { beforeEach, describe, expect, it, vi } from "vitest";

const mockExtensionApi = vi.hoisted(() => ({
  browser: {} as {
    scripting?: {
      executeScript?: ReturnType<typeof vi.fn>;
      insertCSS?: ReturnType<typeof vi.fn>;
    };
    tabs?: {
      query?: ReturnType<typeof vi.fn>;
      sendMessage?: ReturnType<typeof vi.fn>;
    };
  },
}));

vi.mock("../src/browser/extensionApi", () => ({
  default: mockExtensionApi.browser,
}));

describe("browser tabs helpers", () => {
  beforeEach(() => {
    vi.resetModules();
    mockExtensionApi.browser.scripting = undefined;
    mockExtensionApi.browser.tabs = undefined;
  });

  it("sends insert messages to the active ChatGPT tab", async () => {
    const sendMessage = vi.fn().mockResolvedValue({ inserted: true });
    mockExtensionApi.browser.tabs = {
      query: vi.fn().mockResolvedValue([
        {
          id: 42,
          url: "https://chatgpt.com/c/test-conversation",
        },
      ]),
      sendMessage,
    };
    const { sendMessageToActiveChatGptTab } = await import("../src/browser/tabs");
    const message = {
      type: "INSERT_TEXT_IN_CHATGPT",
      payload: { text: "Saved note" },
    } as const;

    await expect(sendMessageToActiveChatGptTab(message)).resolves.toEqual({ inserted: true });

    expect(mockExtensionApi.browser.tabs.query).toHaveBeenCalledWith({
      active: true,
      currentWindow: true,
    });
    expect(sendMessage).toHaveBeenCalledWith(42, message);
  });

  it("falls back to an active ChatGPT tab when the current window is the notes UI", async () => {
    const sendMessage = vi.fn().mockResolvedValue({ inserted: true });
    const query = vi
      .fn()
      .mockResolvedValueOnce([
        {
          id: 7,
          url: "moz-extension://extension-id/sidebar.html",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 42,
          url: "https://chatgpt.com/c/test-conversation",
        },
      ]);
    mockExtensionApi.browser.tabs = { query, sendMessage };
    const { sendMessageToActiveChatGptTab } = await import("../src/browser/tabs");
    const message = {
      type: "INSERT_TEXT_IN_CHATGPT",
      payload: { text: "Saved note" },
    } as const;

    await expect(sendMessageToActiveChatGptTab(message)).resolves.toEqual({ inserted: true });

    expect(query).toHaveBeenNthCalledWith(2, {
      active: true,
      url: ["https://chatgpt.com/*", "https://chat.openai.com/*"],
    });
    expect(sendMessage).toHaveBeenCalledWith(42, message);
  });

  it("reinjects the ChatGPT content script before retrying unreachable tabs", async () => {
    const executeScript = vi.fn().mockResolvedValue(undefined);
    const insertCSS = vi.fn().mockResolvedValue(undefined);
    const sendMessage = vi.fn().mockRejectedValueOnce(new Error("No receiving end")).mockResolvedValueOnce({
      inserted: true,
    });
    mockExtensionApi.browser.scripting = { executeScript, insertCSS };
    mockExtensionApi.browser.tabs = {
      query: vi.fn().mockResolvedValue([
        {
          id: 42,
          url: "https://chatgpt.com/c/test-conversation",
        },
      ]),
      sendMessage,
    };
    const { sendMessageToActiveChatGptTab } = await import("../src/browser/tabs");
    const message = {
      type: "INSERT_TEXT_IN_CHATGPT",
      payload: { text: "Saved note" },
    } as const;

    await expect(sendMessageToActiveChatGptTab(message)).resolves.toEqual({ inserted: true });

    expect(insertCSS).toHaveBeenCalledWith({
      target: { tabId: 42 },
      files: ["injected.css"],
    });
    expect(executeScript).toHaveBeenCalledWith({
      target: { tabId: 42 },
      files: ["content.js"],
    });
    expect(sendMessage).toHaveBeenCalledTimes(2);
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

  it("injects the content script and stylesheet into DeepWiki tabs", async () => {
    const executeScript = vi.fn().mockResolvedValue(undefined);
    const insertCSS = vi.fn().mockResolvedValue(undefined);
    mockExtensionApi.browser.scripting = { executeScript, insertCSS };
    const { ensureChatGptContentScript } = await import("../src/browser/tabs");

    await ensureChatGptContentScript({
      id: 42,
      url: "https://deepwiki.com/NethermindEth/juno",
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

  it("returns active DeepWiki context for DeepWiki tabs", async () => {
    mockExtensionApi.browser.tabs = {
      query: vi.fn().mockResolvedValue([
        {
          url: "https://deepwiki.com/NethermindEth/juno/4.2-rpc-system",
          title: "RPC System | DeepWiki",
        },
      ]),
    };
    const { getActiveChatGptContext } = await import("../src/browser/tabs");

    await expect(getActiveChatGptContext()).resolves.toEqual({
      source: "deepwiki",
      sourceThreadId: "deepwiki:NethermindEth/juno",
      title: "RPC System",
      url: "https://deepwiki.com/NethermindEth/juno/4.2-rpc-system",
    });
  });

  it("can ensure the active capturable tab has the content script", async () => {
    const executeScript = vi.fn().mockResolvedValue(undefined);
    const insertCSS = vi.fn().mockResolvedValue(undefined);
    mockExtensionApi.browser.scripting = { executeScript, insertCSS };
    mockExtensionApi.browser.tabs = {
      query: vi.fn().mockResolvedValue([
        {
          id: 42,
          url: "https://deepwiki.com/search/question-id",
        },
      ]),
    };
    const { ensureActiveCapturableContentScript } = await import("../src/browser/tabs");

    await ensureActiveCapturableContentScript();

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
