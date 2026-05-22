import browser from "../browser/extensionApi";

const SIDEBAR_PAGE = "sidebar.html";
const SIDEBAR_WINDOW_WIDTH = 460;
const SIDEBAR_WINDOW_HEIGHT = 760;

let detachedSidebarWindowId: number | null = null;

export function initializeDetachedSidebarWindowTracking(): void {
  browser.windows.onRemoved.addListener((windowId) => {
    if (windowId === detachedSidebarWindowId) {
      detachedSidebarWindowId = null;
    }
  });
}

export async function openDetachedSidebarWindow(): Promise<void> {
  const sidebarUrl = browser.runtime.getURL(SIDEBAR_PAGE);

  if (typeof detachedSidebarWindowId === "number") {
    try {
      await browser.windows.update(detachedSidebarWindowId, { focused: true });
      return;
    } catch {
      detachedSidebarWindowId = null;
    }
  }

  if (await focusExistingDetachedSidebarWindow(sidebarUrl)) {
    return;
  }

  const createdWindow = await browser.windows.create({
    focused: true,
    height: SIDEBAR_WINDOW_HEIGHT,
    type: "popup",
    url: sidebarUrl,
    width: SIDEBAR_WINDOW_WIDTH,
  });

  detachedSidebarWindowId = typeof createdWindow.id === "number" ? createdWindow.id : null;
}

async function focusExistingDetachedSidebarWindow(sidebarUrl: string): Promise<boolean> {
  try {
    const popupWindows = await browser.windows.getAll({ populate: true, windowTypes: ["popup"] });
    const existingWindow = popupWindows.find((popupWindow) =>
      popupWindow.tabs?.some((tab) => tab.url === sidebarUrl),
    );

    if (typeof existingWindow?.id !== "number") {
      return false;
    }

    detachedSidebarWindowId = existingWindow.id;
    await browser.windows.update(existingWindow.id, { focused: true });
    return true;
  } catch {
    detachedSidebarWindowId = null;
    return false;
  }
}
