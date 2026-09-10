import { describe, expect, it } from "vitest";
import {
  insertTabAt,
  adjacentTabId,
  appendTabsToPane,
  moveTabBetweenPanes,
  removeTabFromPane,
  reorderTabInPane,
  type PaneTabs,
} from "./paneLayout";

interface TestTab { id: string }
const pane = (ids: string[], activeTabId: string | null = ids[0] ?? null): PaneTabs<TestTab> => ({
  tabs: ids.map((id) => ({ id })),
  activeTabId,
});

describe("pane tab state", () => {
  it("selects the next tab when the active tab is removed", () => {
    expect(removeTabFromPane(pane(["a", "b", "c"], "b"), "b")).toEqual({
      tabs: [{ id: "a" }, { id: "c" }],
      activeTabId: "c",
    });
  });

  it("leaves an initialized pane empty after removing its last tab", () => {
    expect(removeTabFromPane(pane(["a"]), "a")).toEqual({ tabs: [], activeTabId: null });
  });

  it("inserts and activates a tab at a bounded position", () => {
    expect(insertTabAt(pane(["a", "c"]), { id: "b" }, 1)).toEqual({
      tabs: [{ id: "a" }, { id: "b" }, { id: "c" }],
      activeTabId: "b",
    });
  });

  it("reorders an existing tab without duplicating it", () => {
    expect(reorderTabInPane(pane(["a", "b", "c"], "a"), "a", 2)).toEqual({
      tabs: [{ id: "b" }, { id: "c" }, { id: "a" }],
      activeTabId: "a",
    });
  });

  it("moves a tab between panes and activates it in the destination", () => {
    expect(moveTabBetweenPanes([pane(["a", "b"], "a"), pane(["c"], "c")], "b", 1, 0)).toEqual([
      { tabs: [{ id: "a" }], activeTabId: "a" },
      { tabs: [{ id: "b" }, { id: "c" }], activeTabId: "b" },
    ]);
  });

  it("appends runnable tabs and activates the first new tab", () => {
    expect(appendTabsToPane(pane(["a"], "a"), [{ id: "b" }, { id: "c" }])).toEqual({
      tabs: [{ id: "a" }, { id: "b" }, { id: "c" }],
      activeTabId: "b",
    });
  });

  it("wraps focused-pane tab navigation", () => {
    expect(adjacentTabId(pane(["a", "b", "c"], "a"), -1)).toBe("c");
    expect(adjacentTabId(pane(["a", "b", "c"], "c"), 1)).toBe("a");
  });
});
