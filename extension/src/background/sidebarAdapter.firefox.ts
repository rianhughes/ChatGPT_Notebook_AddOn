import browser from "../browser/extensionApi";
import type { SidebarAdapter } from "./sidebarAdapter";

type FirefoxSidebarAction = {
  open?: () => Promise<void>;
  setPanel?: (details: { panel: string }) => Promise<void>;
  toggle?: () => Promise<void>;
};

export function createFirefoxSidebarAdapter(): SidebarAdapter {
  const sidebarAction = (browser as unknown as { sidebarAction?: FirefoxSidebarAction }).sidebarAction;

  return {
    async initialize() {
      await sidebarAction?.setPanel?.({ panel: "sidebar.html" });
    },
    async openForCurrentWindow() {
      await sidebarAction?.open?.();
    },
    async toggleForCurrentWindow() {
      if (sidebarAction?.toggle) {
        await sidebarAction.toggle();
        return;
      }

      await sidebarAction?.open?.();
    },
  };
}
