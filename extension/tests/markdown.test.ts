import { describe, expect, it } from "vitest";

import { deleteHeadingSectionFromMarkdown, extractHeadingSectionFromMarkdown } from "../src/core/markdown";

describe("markdown", () => {
  it("deletes a heading section through nested child headings", () => {
    const markdown = [
      "# Intro",
      "",
      "Keep this.",
      "",
      "## Alpha",
      "",
      "Alpha body.",
      "",
      "### Nested",
      "",
      "Nested body.",
      "",
      "## Beta",
      "",
      "Beta body.",
    ].join("\n");

    expect(deleteHeadingSectionFromMarkdown(markdown, 1)).toBe(
      ["# Intro", "", "Keep this.", "", "## Beta", "", "Beta body."].join("\n"),
    );
  });

  it("ignores markdown-looking headings inside fenced code", () => {
    const markdown = [
      "## Alpha",
      "",
      "```md",
      "## Not a section",
      "```",
      "",
      "Alpha body.",
      "",
      "## Beta",
      "",
      "Beta body.",
    ].join("\n");

    expect(deleteHeadingSectionFromMarkdown(markdown, 0)).toBe("## Beta\n\nBeta body.");
  });

  it("extracts a heading section through nested child headings", () => {
    const markdown = [
      "# Intro",
      "",
      "Keep this.",
      "",
      "## Alpha",
      "",
      "Alpha body.",
      "",
      "### Nested",
      "",
      "Nested body.",
      "",
      "## Beta",
      "",
      "Beta body.",
    ].join("\n");

    expect(extractHeadingSectionFromMarkdown(markdown, 1)).toBe(
      ["## Alpha", "", "Alpha body.", "", "### Nested", "", "Nested body."].join("\n"),
    );
  });
});
