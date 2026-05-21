import browser from "../browser/extensionApi";
import type { SidebarAdapter, SidebarOpenContext } from "./sidebarAdapter";

type ChromeSidePanel = {
  setPanelBehavior?: (details: { openPanelOnActionClick: boolean }) => Promise<void>;
  open?: (details: { windowId?: number; tabId?: number }) => Promise<void>;
};

export function createChromeSidebarAdapter(): SidebarAdapter {
  const sidePanel = (browser as unknown as { sidePanel?: ChromeSidePanel }).sidePanel;

  return {
    async initialize() {
      await sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: true });
    },
    async openForCurrentWindow(context?: SidebarOpenContext) {
      const openOptions = getOpenOptions(context);

      if (!openOptions) {
        return;
      }

      await sidePanel?.open?.(openOptions);
    },
  };
}

function getOpenOptions(context?: SidebarOpenContext): { windowId?: number; tabId?: number } | null {
  if (typeof context?.windowId === "number") {
    return { windowId: context.windowId };
  }

  if (typeof context?.tabId === "number") {
    return { tabId: context.tabId };
  }

  return null;
}
