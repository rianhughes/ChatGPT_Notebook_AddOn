import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BackToTopButton } from "../src/sidebar/components/BackToTopButton";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const originalScrollY = Object.getOwnPropertyDescriptor(window, "scrollY");
const originalScrollTo = window.scrollTo;

afterEach(() => {
  document.body.innerHTML = "";

  if (originalScrollY) {
    Object.defineProperty(window, "scrollY", originalScrollY);
  }

  window.scrollTo = originalScrollTo;
});

describe("BackToTopButton", () => {
  it("appears after scrolling and scrolls back to the top", async () => {
    setScrollY(0);
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);

    await act(() => {
      root.render(<BackToTopButton />);
    });

    expect(host.querySelector<HTMLButtonElement>('button[aria-label="Back to top"]')).toBeNull();

    setScrollY(220);

    await act(() => {
      window.dispatchEvent(new Event("scroll"));
    });

    const button = host.querySelector<HTMLButtonElement>('button[aria-label="Back to top"]');

    expect(button).not.toBeNull();

    await act(() => {
      button?.click();
    });

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "smooth" });

    await act(() => {
      root.unmount();
    });
  });
});

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    value,
  });
}
