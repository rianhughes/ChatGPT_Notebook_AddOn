import { beforeEach, describe, expect, it, vi } from "vitest";

const mockExtensionApi = vi.hoisted(() => ({
  browser: {} as {
    sidePanel?: {
      setPanelBehavior?: ReturnType<typeof vi.fn>;
      open?: ReturnType<typeof vi.fn>;
    };
    sidebarAction?: {
      setPanel?: ReturnType<typeof vi.fn>;
      open?: ReturnType<typeof vi.fn>;
      toggle?: ReturnType<typeof vi.fn>;
    };
  },
}));

vi.mock("../src/browser/extensionApi", () => ({
  default: mockExtensionApi.browser,
}));

describe("sidebar adapters", () => {
  beforeEach(() => {
    mockExtensionApi.browser.sidePanel = undefined;
    mockExtensionApi.browser.sidebarAction = undefined;
  });

  it("configures Chrome action clicks to open the side panel", async () => {
    const setPanelBehavior = vi.fn().mockResolvedValue(undefined);
    mockExtensionApi.browser.sidePanel = { setPanelBehavior };
    const { createChromeSidebarAdapter } = await import("../src/background/sidebarAdapter.chrome");

    await createChromeSidebarAdapter().initialize();

    expect(setPanelBehavior).toHaveBeenCalledWith({ openPanelOnActionClick: true });
  });

  it("leaves Chrome action-click toggling to the browser after configuring it", async () => {
    const setPanelBehavior = vi.fn().mockResolvedValue(undefined);
    const open = vi.fn().mockResolvedValue(undefined);
    mockExtensionApi.browser.sidePanel = { setPanelBehavior, open };
    const { createChromeSidebarAdapter } = await import("../src/background/sidebarAdapter.chrome");
    const adapter = createChromeSidebarAdapter();

    await adapter.initialize();
    await adapter.toggleForCurrentWindow({ windowId: 123 });

    expect(open).not.toHaveBeenCalled();
  });

  it("falls back to opening Chrome side panel when native action toggling is unavailable", async () => {
    const open = vi.fn().mockResolvedValue(undefined);
    mockExtensionApi.browser.sidePanel = { open };
    const { createChromeSidebarAdapter } = await import("../src/background/sidebarAdapter.chrome");

    await createChromeSidebarAdapter().toggleForCurrentWindow({ windowId: 123 });

    expect(open).toHaveBeenCalledWith({ windowId: 123 });
  });

  it("opens the Chrome side panel with a window id when available", async () => {
    const open = vi.fn().mockResolvedValue(undefined);
    mockExtensionApi.browser.sidePanel = { open };
    const { createChromeSidebarAdapter } = await import("../src/background/sidebarAdapter.chrome");

    await createChromeSidebarAdapter().openForCurrentWindow({ windowId: 123, tabId: 456 });

    expect(open).toHaveBeenCalledWith({ windowId: 123 });
  });

  it("falls back to tab id when opening the Chrome side panel", async () => {
    const open = vi.fn().mockResolvedValue(undefined);
    mockExtensionApi.browser.sidePanel = { open };
    const { createChromeSidebarAdapter } = await import("../src/background/sidebarAdapter.chrome");

    await createChromeSidebarAdapter().openForCurrentWindow({ tabId: 456 });

    expect(open).toHaveBeenCalledWith({ tabId: 456 });
  });

  it("does not call Chrome sidePanel.open without an open context", async () => {
    const open = vi.fn().mockResolvedValue(undefined);
    mockExtensionApi.browser.sidePanel = { open };
    const { createChromeSidebarAdapter } = await import("../src/background/sidebarAdapter.chrome");

    await createChromeSidebarAdapter().openForCurrentWindow();

    expect(open).not.toHaveBeenCalled();
  });

  it("keeps Firefox sidebar opening unchanged", async () => {
    const setPanel = vi.fn().mockResolvedValue(undefined);
    const open = vi.fn().mockResolvedValue(undefined);
    mockExtensionApi.browser.sidebarAction = { setPanel, open };
    const { createFirefoxSidebarAdapter } = await import("../src/background/sidebarAdapter.firefox");
    const adapter = createFirefoxSidebarAdapter();

    await adapter.initialize();
    await adapter.openForCurrentWindow({ windowId: 123, tabId: 456 });

    expect(setPanel).toHaveBeenCalledWith({ panel: "sidebar.html" });
    expect(open).toHaveBeenCalledWith();
  });

  it("toggles the Firefox sidebar from action clicks", async () => {
    const toggle = vi.fn().mockResolvedValue(undefined);
    const open = vi.fn().mockResolvedValue(undefined);
    mockExtensionApi.browser.sidebarAction = { toggle, open };
    const { createFirefoxSidebarAdapter } = await import("../src/background/sidebarAdapter.firefox");

    await createFirefoxSidebarAdapter().toggleForCurrentWindow({ windowId: 123, tabId: 456 });

    expect(toggle).toHaveBeenCalledWith();
    expect(open).not.toHaveBeenCalled();
  });
});
