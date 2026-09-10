import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useTerminalLayout, type PaneIndex } from "../layout/TerminalLayoutContext";
import TerminalHost from "../modules/terminal/TerminalHost";
import PaneTabs from "./PaneTabs";

const PANES: PaneIndex[] = [0, 1, 2];

function SplitLayout() {
  const { state, allTabs, activeWorktree, paneOf, focusSlot, newTab, drag } = useTerminalLayout();
  const layoutClass = `layout-area${state.vertical ? " vertical" : ""}${state.bottom ? " bottom" : ""}`;
  const draggedTab = drag ? allTabs.find((tab) => tab.id === drag.tabId) : null;

  const paneVisible = (pane: PaneIndex) =>
    pane === 0 || (pane === 1 ? state.vertical : state.bottom);

  return (
    <div className={layoutClass}>
      {PANES.map((paneIndex) => {
        const pane = state.panes[paneIndex];
        if (!pane || !paneVisible(paneIndex)) return null;
        const focused = state.focusedPane === paneIndex;
        const dropTarget = drag?.targetPane === paneIndex;
        return (
          <div
            key={`pane-${paneIndex}`}
            className={`slot pane-frame slot-${paneIndex}${focused ? " slot-active" : " slot-inactive"}${dropTarget ? " slot-drop-target" : ""}`}
            data-pane-index={paneIndex}
          >
            <PaneTabs
              pane={paneIndex}
              tabs={pane.tabs}
              activeTabId={pane.activeTabId}
              focused={focused}
              dropIndex={drag?.targetPane === paneIndex ? drag.targetIndex : null}
              onFocus={() => focusSlot(paneIndex)}
            />
            {pane.tabs.length === 0 && (
              <SlotPlaceholder
                highlighted={dropTarget}
                onActivate={() => {
                  focusSlot(paneIndex);
                  newTab(paneIndex);
                }}
              />
            )}
          </div>
        );
      })}

      {allTabs.map((tab) => {
        const owner = paneOf(tab.id);
        const pane = owner == null ? null : state.panes[owner];
        const visible = tab.worktree === activeWorktree
          && owner != null
          && paneVisible(owner)
          && pane != null
          && pane.activeTabId === tab.id;
        const dropTarget = drag?.targetPane === owner;
        return (
          <div
            key={tab.id}
            className={`slot-host slot-${owner ?? 0}${visible ? "" : " host-hidden"}${dropTarget ? " slot-drop-target" : ""}`}
            data-pane-index={owner ?? undefined}
          >
            <TerminalHost tabId={tab.id} slot={visible ? owner : null} visible={visible} />
          </div>
        );
      })}

      {drag && draggedTab && (
        <div className="tab-drag-ghost" style={{ left: drag.x, top: drag.y }}>
          {draggedTab.title}
        </div>
      )}
    </div>
  );
}

interface SlotPlaceholderProps {
  highlighted: boolean;
  onActivate: () => void;
}

function SlotPlaceholder({ highlighted, onActivate }: SlotPlaceholderProps) {
  return (
    <div className={`slot-placeholder${highlighted ? " slot-drop-target" : ""}`}>
      <Button
        type="text"
        size="small"
        icon={<PlusOutlined />}
        onClick={onActivate}
        className="slot-placeholder-button"
      >
        Create a terminal
      </Button>
    </div>
  );
}

export default SplitLayout;
