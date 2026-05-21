import { describe, expect, it } from "vitest";

import { getNoteHeaderParts } from "../src/sidebar/components/MessageList";

describe("MessageList note headers", () => {
  it("copies the first non-empty line as the default note header and keeps the body intact", () => {
    expect(getNoteHeaderParts(["", "Here is the visible header", "", "Body line one", "Body line two"].join("\n"))).toEqual(
      {
        header: "Here is the visible header",
        bodyMarkdown: "Here is the visible header\n\nBody line one\nBody line two",
      },
    );
  });

  it("strips simple markdown markers from the header text", () => {
    expect(getNoteHeaderParts("## Architecture notes\n\nDetails")).toEqual({
      header: "Architecture notes",
      bodyMarkdown: "## Architecture notes\n\nDetails",
    });
  });

  it("uses a custom note header when one is saved", () => {
    expect(getNoteHeaderParts("## Architecture notes\n\nDetails", "Custom summary")).toEqual({
      header: "Custom summary",
      bodyMarkdown: "## Architecture notes\n\nDetails",
    });
  });
});
