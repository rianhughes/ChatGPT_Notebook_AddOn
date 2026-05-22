import { describe, expect, it } from "vitest";

import { syncDefaultCollapsedMessageIds } from "../src/sidebar/noteCollapseDefaults";

describe("syncDefaultCollapsedMessageIds", () => {
  it("collapses every note on the first notebook load", () => {
    const synced = syncDefaultCollapsedMessageIds(
      [{ id: "first" }, { id: "second" }],
      new Set<string>(),
      new Set<string>(),
    );

    expect([...synced.collapsedMessageIds]).toEqual(["first", "second"]);
    expect([...synced.knownMessageIds]).toEqual(["first", "second"]);
    expect(synced.changed).toBe(true);
  });

  it("keeps manually expanded notes expanded on refresh", () => {
    const synced = syncDefaultCollapsedMessageIds(
      [{ id: "first" }, { id: "second" }],
      new Set<string>(["second"]),
      new Set<string>(["first", "second"]),
    );

    expect([...synced.collapsedMessageIds]).toEqual(["second"]);
    expect(synced.changed).toBe(false);
  });

  it("collapses newly added notes while pruning deleted notes", () => {
    const synced = syncDefaultCollapsedMessageIds(
      [{ id: "second" }, { id: "third" }],
      new Set<string>(["first", "second"]),
      new Set<string>(["first", "second"]),
    );

    expect([...synced.collapsedMessageIds]).toEqual(["second", "third"]);
    expect([...synced.knownMessageIds]).toEqual(["second", "third"]);
    expect(synced.changed).toBe(true);
  });
});
