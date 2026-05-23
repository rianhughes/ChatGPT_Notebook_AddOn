import { createChromeSidebarAdapter } from "./sidebarAdapter.chrome";
import { createFirefoxSidebarAdapter } from "./sidebarAdapter.firefox";

export type SidebarOpenContext = {
  windowId?: number;
  tabId?: number;
};

export type SidebarAdapter = {
  initialize(): Promise<void>;
  openForCurrentWindow(context?: SidebarOpenContext): Promise<void>;
  toggleForCurrentWindow(context?: SidebarOpenContext): Promise<void>;
};

export function createSidebarAdapter(): SidebarAdapter {
  if (__BROWSER_TARGET__ === "chrome") {
    return createChromeSidebarAdapter();
  }

  return createFirefoxSidebarAdapter();
}
