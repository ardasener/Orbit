import type { MouseEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef } from "react";
import { Tabs } from "antd";
import type { TabsProps } from "antd";
import { useTerminalLayout, type PaneIndex } from "../layout/TerminalLayoutContext";

interface PaneTabsProps {
  pane: PaneIndex;
  tabs: NonNullable<ReturnType<typeof useTerminalLayout>["state"]["panes"][number]>["tabs"];
  activeTabId: string | null;
  focused: boolean;
  dropIndex: number | null;
  onFocus: () => void;
}

function PaneTabs({ pane, tabs, activeTabId, focused, dropIndex, onFocus }: PaneTabsProps) {
  const { newTab, closeTab, selectTab, beginDrag } = useTerminalLayout();
  const pressRef = useRef<{ tabId: string; x: number; y: number } | null>(null);
  const tabsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!activeTabId) return;
    const active = Array.from(tabsRef.current?.querySelectorAll<HTMLElement>("[data-pane-tab]") ?? [])
      .find((element) => element.dataset.paneTab === activeTabId);
    active?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeTabId]);

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const strip = tabsRef.current?.querySelector<HTMLElement>(".ant-tabs-nav-wrap");
    if (!strip || strip.scrollWidth <= strip.clientWidth) return;
    strip.scrollLeft += event.deltaY + event.deltaX;
  };

  const clearPress = () => {
    pressRef.current = null;
  };

  const handleMouseDown = (tabId: string) => (event: MouseEvent<HTMLSpanElement>) => {
    if (event.button !== 0) return;
    onFocus();
    pressRef.current = { tabId, x: event.clientX, y: event.clientY };
  };

  const handleMouseMove = (tabId: string) => (event: MouseEvent<HTMLSpanElement>) => {
    const press = pressRef.current;
    if (!press || press.tabId !== tabId) return;
    const dx = event.clientX - press.x;
    const dy = event.clientY - press.y;
    if (dx * dx + dy * dy > 16) {
      pressRef.current = null;
      beginDrag(tabId, pane, event.clientX, event.clientY);
    }
  };

  const items = useMemo<TabsProps["items"]>(
    () => tabs.map((tab) => ({
      key: tab.id,
      closable: true,
      label: (
        <span
          data-pane-tab={tab.id}
          onMouseDown={handleMouseDown(tab.id)}
          onMouseMove={handleMouseMove(tab.id)}
          onMouseUp={clearPress}
          onMouseLeave={clearPress}
        >
          {tab.title}
        </span>
      ),
      children: null as ReactNode,
    })),
    // The handlers intentionally close over this pane's drag source.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tabs, pane],
  );

  return (
    <div
      ref={tabsRef}
      className={`pane-tabs${focused ? " pane-tabs-focused" : " pane-tabs-inactive"}${dropIndex != null ? " pane-tabs-drop-target" : ""}`}
      data-pane-tabbar="true"
      data-drop-index={dropIndex ?? undefined}
      onMouseDown={onFocus}
      onWheel={handleWheel}
    >
      <Tabs
        type="editable-card"
        size="small"
        hideAdd={false}
        activeKey={activeTabId ?? undefined}
        items={items}
        onChange={(tabId) => selectTab(tabId)}
        onEdit={(targetKey, action) => {
          if (action === "add") {
            newTab(pane);
          } else if (typeof targetKey === "string") {
            closeTab(targetKey);
          }
        }}
      />
    </div>
  );
}

export default PaneTabs;
