export interface TabIdentity {
  id: string;
}

export interface PaneTabs<T extends TabIdentity> {
  tabs: T[];
  activeTabId: string | null;
}

/** Remove a tab and select the nearest remaining tab when it was active. */
export function removeTabFromPane<T extends TabIdentity>(
  pane: PaneTabs<T>,
  tabId: string,
): PaneTabs<T> {
  const index = pane.tabs.findIndex((tab) => tab.id === tabId);
  if (index === -1) return pane;
  const tabs = pane.tabs.filter((tab) => tab.id !== tabId);
  const activeTabId = pane.activeTabId === tabId
    ? tabs[Math.min(index, tabs.length - 1)]?.id ?? null
    : pane.activeTabId;
  return { tabs, activeTabId };
}

/** Insert a tab at a bounded position and make it active. */
export function insertTabAt<T extends TabIdentity>(
  pane: PaneTabs<T>,
  tab: T,
  index: number,
): PaneTabs<T> {
  const tabs = [...pane.tabs];
  tabs.splice(Math.max(0, Math.min(index, tabs.length)), 0, tab);
  return { tabs, activeTabId: tab.id };
}

/** Reorder an existing tab and keep it active. */
export function reorderTabInPane<T extends TabIdentity>(
  pane: PaneTabs<T>,
  tabId: string,
  index: number,
): PaneTabs<T> {
  const tab = pane.tabs.find((candidate) => candidate.id === tabId);
  if (!tab) return pane;
  const withoutTab = removeTabFromPane({ ...pane, activeTabId: null }, tabId);
  return insertTabAt(withoutTab, tab, index);
}

/** Move a tab between pane tab sets, or reorder it within its current pane. */
export function moveTabBetweenPanes<T extends TabIdentity>(
  panes: readonly (PaneTabs<T> | null)[],
  tabId: string,
  destinationPane: number,
  index: number,
): (PaneTabs<T> | null)[] {
  const sourcePane = panes.findIndex((pane) => pane?.tabs.some((tab) => tab.id === tabId));
  const target = panes[destinationPane];
  if (sourcePane === -1 || !target) return [...panes];
  if (sourcePane === destinationPane) {
    const next = [...panes];
    next[destinationPane] = reorderTabInPane(target, tabId, index);
    return next;
  }
  const source = panes[sourcePane];
  const tab = source?.tabs.find((candidate) => candidate.id === tabId);
  if (!source || !tab) return [...panes];
  const next = [...panes];
  next[sourcePane] = removeTabFromPane(source, tabId);
  next[destinationPane] = insertTabAt(target, tab, index);
  return next;
}

/** Append a batch of tabs and activate the first newly appended tab. */
export function appendTabsToPane<T extends TabIdentity>(
  pane: PaneTabs<T>,
  tabsToAppend: T[],
): PaneTabs<T> {
  if (tabsToAppend.length === 0) return pane;
  return { tabs: [...pane.tabs, ...tabsToAppend], activeTabId: tabsToAppend[0].id };
}

/** Select the adjacent tab in a pane, wrapping at either end. */
export function adjacentTabId<T extends TabIdentity>(
  pane: PaneTabs<T>,
  delta: number,
): string | null {
  if (pane.tabs.length === 0) return null;
  const index = pane.activeTabId == null
    ? -1
    : pane.tabs.findIndex((tab) => tab.id === pane.activeTabId);
  return pane.tabs[index === -1 ? 0 : (index + delta + pane.tabs.length) % pane.tabs.length].id;
}
