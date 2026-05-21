import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

declare const process: { env: { BROWSER_TARGET?: string } };

export default defineConfig({
  plugins: [react()],
  define: {
    __BROWSER_TARGET__: JSON.stringify(process.env.BROWSER_TARGET ?? "firefox"),
  },
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "https://chatgpt.com/c/test-conversation",
      },
    },
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
