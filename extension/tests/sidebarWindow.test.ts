import { beforeEach, describe, expect, it, vi } from "vitest";

const mockExtensionApi = vi.hoisted(() => ({
  browser: {
    runtime: {
      getURL: vi.fn((path: string) => `extension://${path}`),
    },
    windows: {
      create: vi.fn(),
      getAll: vi.fn(),
      onRemoved: {
        addListener: vi.fn(),
      },
      update: vi.fn(),
    },
  },
}));

vi.mock("../src/browser/extensionApi", () => ({
  default: mockExtensionApi.browser,
}));

describe("detached sidebar window", () => {
  beforeEach(() => {
    vi.resetModules();
    mockExtensionApi.browser.runtime.getURL.mockClear();
    mockExtensionApi.browser.windows.create.mockReset();
    mockExtensionApi.browser.windows.getAll.mockReset();
    mockExtensionApi.browser.windows.getAll.mockResolvedValue([]);
    mockExtensionApi.browser.windows.onRemoved.addListener.mockReset();
    mockExtensionApi.browser.windows.update.mockReset();
  });

  it("opens the sidebar in a focused popup window", async () => {
    mockExtensionApi.browser.windows.create.mockResolvedValue({ id: 42 });
    const { openDetachedSidebarWindow } = await import("../src/background/sidebarWindow");

    await openDetachedSidebarWindow();

    expect(mockExtensionApi.browser.runtime.getURL).toHaveBeenCalledWith("sidebar.html");
    expect(mockExtensionApi.browser.windows.create).toHaveBeenCalledWith({
      focused: true,
      height: 760,
      type: "popup",
      url: "extension://sidebar.html",
      width: 460,
    });
  });

  it("focuses the existing detached window after it has been opened", async () => {
    mockExtensionApi.browser.windows.create.mockResolvedValue({ id: 42 });
    mockExtensionApi.browser.windows.update.mockResolvedValue({ id: 42 });
    const { openDetachedSidebarWindow } = await import("../src/background/sidebarWindow");

    await openDetachedSidebarWindow();
    await openDetachedSidebarWindow();

    expect(mockExtensionApi.browser.windows.create).toHaveBeenCalledTimes(1);
    expect(mockExtensionApi.browser.windows.update).toHaveBeenCalledWith(42, { focused: true });
  });

  it("focuses an existing sidebar popup after module state has been reset", async () => {
    mockExtensionApi.browser.windows.getAll.mockResolvedValue([
      {
        id: 64,
        tabs: [{ url: "extension://sidebar.html" }],
      },
    ]);
    mockExtensionApi.browser.windows.update.mockResolvedValue({ id: 64 });
    const { openDetachedSidebarWindow } = await import("../src/background/sidebarWindow");

    await openDetachedSidebarWindow();

    expect(mockExtensionApi.browser.windows.create).not.toHaveBeenCalled();
    expect(mockExtensionApi.browser.windows.update).toHaveBeenCalledWith(64, { focused: true });
  });

  it("forgets the detached window when the browser reports it closed", async () => {
    mockExtensionApi.browser.windows.create.mockResolvedValueOnce({ id: 42 }).mockResolvedValueOnce({ id: 77 });
    const { initializeDetachedSidebarWindowTracking, openDetachedSidebarWindow } = await import(
      "../src/background/sidebarWindow"
    );

    initializeDetachedSidebarWindowTracking();
    await openDetachedSidebarWindow();

    const [onRemoved] = mockExtensionApi.browser.windows.onRemoved.addListener.mock.calls[0] ?? [];
    onRemoved?.(42);

    await openDetachedSidebarWindow();

    expect(mockExtensionApi.browser.windows.create).toHaveBeenCalledTimes(2);
    expect(mockExtensionApi.browser.windows.update).not.toHaveBeenCalled();
  });
});
