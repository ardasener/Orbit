import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ptyShellName } from "../modules/terminal/pty";
import { appendTabsToPane, moveTabBetweenPanes, removeTabFromPane } from "./paneLayout";

export type PaneIndex = 0 | 1 | 2;

export interface TerminalTab {
  id: string;
  title: string;
  fontZoom: number;
  worktree: string;
  command: string | null;
}

export interface PaneState {
  tabs: TerminalTab[];
  activeTabId: string | null;
}

export interface WorktreeLayout {
  panes: [PaneState, PaneState | null, PaneState | null];
  focusedPane: PaneIndex;
  vertical: boolean;
  bottom: boolean;
}

export interface LayoutState {
  panes: [PaneState | null, PaneState | null, PaneState | null];
  focusedPane: PaneIndex;
  vertical: boolean;
  bottom: boolean;
}

export interface TabDrag {
  tabId: string;
  sourcePane: PaneIndex;
  x: number;
  y: number;
  targetPane: PaneIndex | null;
  targetIndex: number | null;
}

interface TerminalLayoutContextValue {
  state: LayoutState;
  allTabs: TerminalTab[];
  worktreeTabCounts: Record<string, number>;
  activeWorktree: string | null;
  shellName: string;
  tabOf: (tabId: string) => TerminalTab | undefined;
  paneOf: (tabId: string) => PaneIndex | null;
  setActiveWorktree: (path: string) => void;
  newTab: (pane?: PaneIndex) => void;
  launchRunnable: (commands: string[]) => void;
  closeTab: (tabId: string) => void;
  closeWorktreeTabs: (path: string) => void;
  selectTab: (tabId: string) => void;
  focusSlot: (slot: PaneIndex) => void;
  toggleVertical: () => void;
  toggleBottom: () => void;
  reorderTab: (tabId: string, pane: PaneIndex, index: number) => void;
  moveTabToPane: (tabId: string, pane: PaneIndex, index: number) => void;
  zoomTab: (tabId: string, delta: number) => void;
  renameTab: (tabId: string, title: string) => void;
  drag: TabDrag | null;
  beginDrag: (tabId: string, pane: PaneIndex, x: number, y: number) => void;
  moveDrag: (x: number, y: number) => void;
  endDrag: () => void;
}

const TerminalLayoutContext = createContext<TerminalLayoutContextValue | null>(null);

let idCounter = 0;
function makeId(): string {
  idCounter += 1;
  return `tab-${idCounter}`;
}

function makeTab(worktree: string, title: string, command: string | null): TerminalTab {
  return { id: makeId(), title, fontZoom: 0, worktree, command };
}

function makePane(worktree: string, title: string): PaneState {
  const tab = makeTab(worktree, title, null);
  return { tabs: [tab], activeTabId: tab.id };
}

function clampIndex(index: number, length: number): number {
  return Math.max(0, Math.min(index, length));
}

export function TerminalLayoutProvider({ children }: { children: ReactNode }) {
  const [shellName, setShellName] = useState("sh");
  useEffect(() => {
    let cancelled = false;
    void ptyShellName()
      .then((name) => {
        if (!cancelled && name) setShellName(name);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const [layouts, setLayouts] = useState<Record<string, WorktreeLayout>>({});
  const [activeWorktree, setActiveWorktreeState] = useState<string | null>(null);
  const activeLayout = activeWorktree == null ? null : layouts[activeWorktree] ?? null;

  const allTabs = useMemo(
    () => Object.values(layouts).flatMap((layout) => layout.panes.flatMap((pane) => pane?.tabs ?? [])),
    [layouts],
  );

  const worktreeTabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [path, layout] of Object.entries(layouts)) {
      counts[path] = layout.panes.reduce((total, pane) => total + (pane?.tabs.length ?? 0), 0);
    }
    return counts;
  }, [layouts]);

  const tabOf = useCallback(
    (tabId: string) => allTabs.find((tab) => tab.id === tabId),
    [allTabs],
  );

  const paneOf = useCallback(
    (tabId: string): PaneIndex | null => {
      for (const layout of Object.values(layouts)) {
        for (let index = 0; index < layout.panes.length; index += 1) {
          if (layout.panes[index]?.tabs.some((tab) => tab.id === tabId)) return index as PaneIndex;
        }
      }
      return null;
    },
    [layouts],
  );

  const layoutOfTab = useCallback(
    (tabId: string) => {
      for (const [path, layout] of Object.entries(layouts)) {
        if (layout.panes.some((pane) => pane?.tabs.some((tab) => tab.id === tabId))) return path;
      }
      return null;
    },
    [layouts],
  );

  const updateLayout = useCallback(
    (path: string, updater: (layout: WorktreeLayout) => WorktreeLayout) => {
      setLayouts((previous) => {
        const layout = previous[path];
        if (!layout) return previous;
        const next = updater(layout);
        return next === layout ? previous : { ...previous, [path]: next };
      });
    },
    [],
  );

  const updateActiveLayout = useCallback(
    (updater: (layout: WorktreeLayout) => WorktreeLayout) => {
      if (activeWorktree == null) return;
      updateLayout(activeWorktree, updater);
    },
    [activeWorktree, updateLayout],
  );

  const setActiveWorktree = useCallback(
    (path: string) => {
      setLayouts((previous) => {
        if (previous[path]) return previous;
        return {
          ...previous,
          [path]: {
            panes: [makePane(path, shellName), null, null],
            focusedPane: 0,
            vertical: false,
            bottom: false,
          },
        };
      });
      setActiveWorktreeState(path);
    },
    [shellName],
  );

  const newTab = useCallback(
    (pane: PaneIndex = activeLayout?.focusedPane ?? 0) => {
      updateActiveLayout((layout) => {
        const current = layout.panes[pane];
        if (!current || activeWorktree == null) return layout;
        const tab = makeTab(activeWorktree, shellName, null);
        const nextPane = { tabs: [...current.tabs, tab], activeTabId: tab.id };
        const panes = [...layout.panes] as WorktreeLayout["panes"];
        panes[pane] = nextPane;
        return { ...layout, panes, focusedPane: pane };
      });
    },
    [activeLayout?.focusedPane, activeWorktree, shellName, updateActiveLayout],
  );

  const launchRunnable = useCallback(
    (commands: string[]) => {
      if (commands.length === 0 || activeWorktree == null) return;
      updateActiveLayout((layout) => {
        const paneIndex = layout.focusedPane;
        const current = layout.panes[paneIndex];
        if (!current) return layout;
        const tabs = commands.map((command) => makeTab(activeWorktree, shellName, command));
        const nextPane = appendTabsToPane(current, tabs);
        const panes = [...layout.panes] as WorktreeLayout["panes"];
        panes[paneIndex] = nextPane;
        return { ...layout, panes };
      });
    },
    [activeWorktree, shellName, updateActiveLayout],
  );

  const closeTab = useCallback(
    (tabId: string) => {
      const path = layoutOfTab(tabId);
      if (!path) return;
      updateLayout(path, (layout) => {
        const panes = [...layout.panes] as WorktreeLayout["panes"];
        for (let index = 0; index < panes.length; index += 1) {
          const pane = panes[index];
          if (!pane) continue;
          const tabIndex = pane.tabs.findIndex((tab) => tab.id === tabId);
          if (tabIndex === -1) continue;
          panes[index] = removeTabFromPane(pane, tabId);
          return { ...layout, panes };
        }
        return layout;
      });
    },
    [layoutOfTab, updateLayout],
  );

  const closeWorktreeTabs = useCallback((path: string) => {
    setLayouts((previous) => {
      if (!previous[path]) return previous;
      const next = { ...previous };
      delete next[path];
      return next;
    });
  }, []);

  const selectTab = useCallback(
    (tabId: string) => {
      updateActiveLayout((layout) => {
        for (let index = 0; index < layout.panes.length; index += 1) {
          const pane = layout.panes[index];
          if (!pane?.tabs.some((tab) => tab.id === tabId)) continue;
          const paneIndex = index as PaneIndex;
          if (pane.activeTabId === tabId && layout.focusedPane === paneIndex) return layout;
          const panes = [...layout.panes] as WorktreeLayout["panes"];
          panes[index] = { ...pane, activeTabId: tabId };
          return { ...layout, panes, focusedPane: paneIndex };
        }
        return layout;
      });
    },
    [updateActiveLayout],
  );

  const focusSlot = useCallback(
    (slot: PaneIndex) => {
      updateActiveLayout((layout) => {
        const visible = slot === 0 || (slot === 1 ? layout.vertical : layout.bottom);
        return visible && layout.panes[slot] && layout.focusedPane !== slot
          ? { ...layout, focusedPane: slot }
          : layout;
      });
    },
    [updateActiveLayout],
  );

  const toggleSplit = useCallback(
    (slot: 1 | 2, key: "vertical" | "bottom") => {
      updateActiveLayout((layout) => {
        const open = !layout[key];
        const panes = [...layout.panes] as WorktreeLayout["panes"];
        if (open && panes[slot] == null && activeWorktree != null) {
          panes[slot] = makePane(activeWorktree, shellName);
        }
        return { ...layout, [key]: open, panes };
      });
    },
    [activeWorktree, shellName, updateActiveLayout],
  );

  const toggleVertical = useCallback(() => toggleSplit(1, "vertical"), [toggleSplit]);
  const toggleBottom = useCallback(() => toggleSplit(2, "bottom"), [toggleSplit]);

  const updateTabOrder = useCallback(
    (tabId: string, destinationPane: PaneIndex, destinationIndex: number) => {
      const path = layoutOfTab(tabId);
      if (!path) return;
      updateLayout(path, (layout) => {
        const panes = moveTabBetweenPanes(
          layout.panes,
          tabId,
          destinationPane,
          clampIndex(destinationIndex, layout.panes[destinationPane]?.tabs.length ?? 0),
        ) as WorktreeLayout["panes"];
        return { ...layout, panes, focusedPane: destinationPane };
      });
    },
    [layoutOfTab, updateLayout],
  );

  const reorderTab = useCallback(
    (tabId: string, pane: PaneIndex, index: number) => updateTabOrder(tabId, pane, index),
    [updateTabOrder],
  );

  const moveTabToPane = useCallback(
    (tabId: string, pane: PaneIndex, index: number) => updateTabOrder(tabId, pane, index),
    [updateTabOrder],
  );

  const zoomTab = useCallback(
    (tabId: string, delta: number) => {
      const path = layoutOfTab(tabId);
      if (!path) return;
      updateLayout(path, (layout) => ({
        ...layout,
        panes: layout.panes.map((pane) => pane
          ? { ...pane, tabs: pane.tabs.map((tab) => tab.id === tabId ? { ...tab, fontZoom: tab.fontZoom + delta } : tab) }
          : null) as WorktreeLayout["panes"],
      }));
    },
    [layoutOfTab, updateLayout],
  );

  const renameTab = useCallback(
    (tabId: string, title: string) => {
      const path = layoutOfTab(tabId);
      if (!path) return;
      updateLayout(path, (layout) => ({
        ...layout,
        panes: layout.panes.map((pane) => pane
          ? { ...pane, tabs: pane.tabs.map((tab) => tab.id === tabId ? { ...tab, title } : tab) }
          : null) as WorktreeLayout["panes"],
      }));
    },
    [layoutOfTab, updateLayout],
  );

  const [drag, setDrag] = useState<TabDrag | null>(null);
  const dragRef = useRef<TabDrag | null>(null);
  useEffect(() => {
    dragRef.current = drag;
  }, [drag]);

  const beginDrag = useCallback((tabId: string, sourcePane: PaneIndex, x: number, y: number) => {
    document.body.classList.add("ol-dragging");
    setDrag({ tabId, sourcePane, x, y, targetPane: sourcePane, targetIndex: 0 });
  }, []);

  const moveDrag = useCallback((x: number, y: number) => {
    setDrag((previous) => {
      if (!previous) return previous;
      const element = document.elementFromPoint(x, y);
      const paneElement = element?.closest?.("[data-pane-index]");
      if (!paneElement) return { ...previous, x, y, targetPane: null, targetIndex: null };
      const pane = Number(paneElement.getAttribute("data-pane-index")) as PaneIndex;
      const tabElement = element?.closest?.("[data-pane-tab]");
      const activePane = activeLayout?.panes[pane];
      if (!activePane) return { ...previous, x, y, targetPane: pane, targetIndex: 0 };
      let targetIndex = activePane.tabs.length;
      if (tabElement) {
        const tabId = tabElement.getAttribute("data-pane-tab");
        const tabIndex = activePane.tabs.findIndex((tab) => tab.id === tabId);
        if (tabIndex !== -1) {
          const rect = tabElement.getBoundingClientRect();
          targetIndex = tabIndex + (x > rect.left + rect.width / 2 ? 1 : 0);
        }
      }
      return { ...previous, x, y, targetPane: pane, targetIndex };
    });
  }, [activeLayout?.panes]);

  const endDrag = useCallback(() => {
    document.body.classList.remove("ol-dragging");
    const current = dragRef.current;
    if (current?.targetPane != null && current.targetIndex != null) {
      moveTabToPane(current.tabId, current.targetPane, current.targetIndex);
    }
    setDrag(null);
  }, [moveTabToPane]);

  useEffect(() => {
    if (!drag) return;
    const onMove = (event: MouseEvent) => {
      event.preventDefault();
      moveDrag(event.clientX, event.clientY);
    };
    const onUp = () => endDrag();
    window.addEventListener("mousemove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [drag, moveDrag, endDrag]);

  const state: LayoutState = useMemo(
    () => activeLayout ?? {
      panes: [null, null, null],
      focusedPane: 0,
      vertical: false,
      bottom: false,
    },
    [activeLayout],
  );

  const value = useMemo<TerminalLayoutContextValue>(() => ({
    state,
    allTabs,
    worktreeTabCounts,
    activeWorktree,
    shellName,
    tabOf,
    paneOf,
    setActiveWorktree,
    newTab,
    launchRunnable,
    closeTab,
    closeWorktreeTabs,
    selectTab,
    focusSlot,
    toggleVertical,
    toggleBottom,
    reorderTab,
    moveTabToPane,
    zoomTab,
    renameTab,
    drag,
    beginDrag,
    moveDrag,
    endDrag,
  }), [
    state, allTabs, worktreeTabCounts, activeWorktree, shellName, tabOf, paneOf,
    setActiveWorktree, newTab, launchRunnable, closeTab, closeWorktreeTabs,
    selectTab, focusSlot, toggleVertical, toggleBottom, reorderTab, moveTabToPane,
    zoomTab, renameTab, drag, beginDrag, moveDrag, endDrag,
  ]);

  return <TerminalLayoutContext.Provider value={value}>{children}</TerminalLayoutContext.Provider>;
}

export function useTerminalLayout(): TerminalLayoutContextValue {
  const context = useContext(TerminalLayoutContext);
  if (!context) throw new Error("useTerminalLayout must be used within TerminalLayoutProvider");
  return context;
}
