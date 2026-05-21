import browser from "../browser/extensionApi";
import type { SidebarAdapter } from "./sidebarAdapter";

type ChromeSidePanel = {
  setPanelBehavior?: (details: { openPanelOnActionClick: boolean }) => Promise<void>;
  open?: (details?: { windowId?: number }) => Promise<void>;
};

export function createChromeSidebarAdapter(): SidebarAdapter {
  const sidePanel = (browser as unknown as { sidePanel?: ChromeSidePanel }).sidePanel;

  return {
    async initialize() {
      await sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: true });
    },
    async openForCurrentWindow() {
      await sidePanel?.open?.();
    },
  };
}
