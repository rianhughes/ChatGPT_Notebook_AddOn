import { createChromeSidebarAdapter } from "./sidebarAdapter.chrome";
import { createFirefoxSidebarAdapter } from "./sidebarAdapter.firefox";

export type SidebarAdapter = {
  initialize(): Promise<void>;
  openForCurrentWindow(): Promise<void>;
};

export function createSidebarAdapter(): SidebarAdapter {
  if (__BROWSER_TARGET__ === "chrome") {
    return createChromeSidebarAdapter();
  }

  return createFirefoxSidebarAdapter();
}
