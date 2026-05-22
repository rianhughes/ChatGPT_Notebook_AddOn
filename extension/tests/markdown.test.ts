import { describe, expect, it } from "vitest";

import {
  convertSelectedTextToHeadingInMarkdown,
  deleteHeadingSectionFromMarkdown,
  extractHeadingSectionFromMarkdown,
  moveSelectedTextToHeadingSectionInMarkdown,
  replaceSelectedTextInMarkdown,
  unmakeHeadingSectionInMarkdown,
} from "../src/core/markdown";

const HEADING_BOUNDARY = "<!-- cgpt-notes-section-boundary:2 -->";
const CHILD_HEADING_BOUNDARY = "<!-- cgpt-notes-section-boundary:3 -->";

describe("markdown", () => {
  it("turns a highlighted paragraph line into a level-two heading", () => {
    const markdown = ["Intro", "", "Make this collapsible", "", "Body under it."].join("\n");

    expect(convertSelectedTextToHeadingInMarkdown(markdown, "Make this collapsible")).toBe(
      ["Intro", "", "## Make this collapsible", "", HEADING_BOUNDARY, "", "Body under it."].join("\n"),
    );
  });

  it("splits highlighted inline text into a standalone heading", () => {
    const markdown = "Intro before selected title and body after.";

    expect(convertSelectedTextToHeadingInMarkdown(markdown, "selected title")).toBe(
      ["Intro before", "", "## selected title", "", HEADING_BOUNDARY, "", "and body after."].join("\n"),
    );
  });

  it("matches rendered text when markdown markers are hidden", () => {
    const markdown = "Turn **this text** into a heading.\n\nBody.";

    expect(convertSelectedTextToHeadingInMarkdown(markdown, "this text")).toBe(
      ["Turn", "", "## this text", "", HEADING_BOUNDARY, "", "into a heading.", "", "Body."].join("\n"),
    );
  });

  it("keeps following text outside a newly converted heading section", () => {
    const markdown = ["Make this collapsible", "", "Body should stay outside."].join("\n");
    const nextMarkdown = convertSelectedTextToHeadingInMarkdown(markdown, "Make this collapsible");

    expect(nextMarkdown).not.toBeNull();
    expect(extractHeadingSectionFromMarkdown(nextMarkdown!, 0)).toBe("## Make this collapsible");
  });

  it("moves highlighted text into the start of a heading section", () => {
    const markdown = ["Intro", "", "## Target", "", "Existing body.", "", "Move me"].join("\n");

    expect(moveSelectedTextToHeadingSectionInMarkdown(markdown, "Move me", 0)).toBe(
      ["Intro", "", "## Target", "", "Move me", "", "Existing body."].join("\n"),
    );
  });

  it("moves highlighted text into a later heading section", () => {
    const markdown = ["Move me", "", "## Target", "", "Existing body."].join("\n");

    expect(moveSelectedTextToHeadingSectionInMarkdown(markdown, "Move me", 0)).toBe(
      ["## Target", "", "Move me", "", "Existing body."].join("\n"),
    );
  });

  it("preserves inline markdown when moving highlighted text", () => {
    const markdown = ["## Target", "", "Existing body.", "", "Move **this text**"].join("\n");

    expect(moveSelectedTextToHeadingSectionInMarkdown(markdown, "this text", 0)).toBe(
      ["## Target", "", "**this text**", "", "Existing body.", "", "Move"].join("\n"),
    );
  });

  it("moves highlighted text inside a bounded heading without pulling outside text in", () => {
    const markdown = ["## Target", "", HEADING_BOUNDARY, "", "Outside body.", "", "Move me"].join("\n");

    expect(moveSelectedTextToHeadingSectionInMarkdown(markdown, "Move me", 0)).toBe(
      ["## Target", "", "Move me", "", HEADING_BOUNDARY, "", "Outside body."].join("\n"),
    );
  });

  it("replaces highlighted text in stored markdown", () => {
    const markdown = "Alpha beta gamma.";

    expect(replaceSelectedTextInMarkdown(markdown, "beta", "edited beta")).toBe("Alpha edited beta gamma.");
  });

  it("replaces a fully highlighted formatted span", () => {
    const markdown = "Alpha **beta** gamma.";

    expect(replaceSelectedTextInMarkdown(markdown, "beta", "edited beta")).toBe("Alpha edited beta gamma.");
  });

  it("unmakes a heading without deleting its section body", () => {
    const markdown = ["# Intro", "", "## Alpha", "", "Alpha body.", "", "## Beta", "", "Beta body."].join("\n");

    expect(unmakeHeadingSectionInMarkdown(markdown, 1)).toBe(
      ["# Intro", "", "Alpha", "", "Alpha body.", "", "## Beta", "", "Beta body."].join("\n"),
    );
  });

  it("unmakes a bounded heading and removes only its hidden boundary", () => {
    const markdown = ["## Alpha", "", "Alpha body.", "", HEADING_BOUNDARY, "", "Outside body."].join("\n");

    expect(unmakeHeadingSectionInMarkdown(markdown, 0)).toBe(
      ["Alpha", "", "Alpha body.", "", "Outside body."].join("\n"),
    );
  });

  it("deletes a bounded heading section without deleting outside text", () => {
    const markdown = ["## Alpha", "", "Alpha body.", "", HEADING_BOUNDARY, "", "Outside body."].join("\n");

    expect(deleteHeadingSectionFromMarkdown(markdown, 0)).toBe("Outside body.");
  });

  it("uses child heading boundaries without ending the parent section", () => {
    const markdown = [
      "## Parent",
      "",
      "Parent intro.",
      "",
      "### Child",
      "",
      "Child body.",
      "",
      CHILD_HEADING_BOUNDARY,
      "",
      "Parent outro.",
    ].join("\n");

    expect(extractHeadingSectionFromMarkdown(markdown, 0)).toBe(
      ["## Parent", "", "Parent intro.", "", "### Child", "", "Child body.", "", "Parent outro."].join("\n"),
    );
    expect(extractHeadingSectionFromMarkdown(markdown, 1)).toBe(["### Child", "", "Child body."].join("\n"));
  });

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
