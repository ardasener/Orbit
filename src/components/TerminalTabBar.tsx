import type { CSSProperties, KeyboardEvent } from "react";
import { useEffect, useState } from "react";
import { Button, Input, Popover, Tooltip } from "antd";
import {
  ClearOutlined,
  ColumnWidthOutlined,
  InsertRowBelowOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  RocketOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useSettings } from "../settings/SettingsContext";
import { useTerminalLayout } from "../layout/TerminalLayoutContext";
import { registerShortcutAction } from "../shortcuts/actionRegistry";
import { isMacOS } from "../lib/platform";
import WindowControls from "./WindowControls";
import "./TerminalTabBar.css";

interface TerminalTabBarProps {
  onOpenSettings: () => void;
  onOpenCleanup: () => void;
  workspacesOpen: boolean;
  onToggleWorkspaces: () => void;
}

/** Global window chrome. Terminal tabs are rendered inside their owning panes. */
function TerminalTabBar({
  onOpenSettings,
  onOpenCleanup,
  workspacesOpen,
  onToggleWorkspaces,
}: TerminalTabBarProps) {
  const { state, newTab, toggleVertical, toggleBottom, launchRunnable } = useTerminalLayout();
  const { settings, palette } = useSettings();
  const showWindowControls = !isMacOS();
  const controlsSide = settings.windowControlsPosition;
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [launcherQuery, setLauncherQuery] = useState("");
  const [launcherIndex, setLauncherIndex] = useState(0);

  useEffect(() => {
    return registerShortcutAction("openLauncher", () => setLauncherOpen(true));
  }, []);

  const launch = (commands: string[]) => {
    setLauncherOpen(false);
    setLauncherQuery("");
    setLauncherIndex(0);
    launchRunnable(commands);
  };

  const filteredRunnables = settings.runnables.filter((runnable) =>
    runnable.name.toLowerCase().includes(launcherQuery.trim().toLowerCase()),
  );

  useEffect(() => {
    setLauncherIndex((index) => Math.min(index, Math.max(0, filteredRunnables.length - 1)));
  }, [filteredRunnables.length]);

  const handleLauncherKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (filteredRunnables.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setLauncherIndex((index) => (index + 1) % filteredRunnables.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setLauncherIndex((index) => (index - 1 + filteredRunnables.length) % filteredRunnables.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      launch(filteredRunnables[launcherIndex].commands);
    }
  };

  return (
    <div
      className="terminal-tabbar"
      data-tauri-drag-region="deep"
      style={isMacOS() ? ({ paddingLeft: 80 } as CSSProperties) : undefined}
    >
      {showWindowControls && controlsSide === "left" && <WindowControls side="left" />}
      <div className="tabbar-actions-left" data-tauri-drag-region="deep">
        <Tooltip title={workspacesOpen ? "Hide workspaces" : "Show workspaces"}>
          <Button
            type="text"
            size="small"
            icon={workspacesOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
            onClick={onToggleWorkspaces}
            aria-label="Toggle workspaces"
          />
        </Tooltip>
        <Tooltip title="Settings">
          <Button type="text" size="small" icon={<SettingOutlined />} onClick={onOpenSettings} aria-label="Settings" />
        </Tooltip>
        <Tooltip title="Clean up workspaces">
          <Button type="text" size="small" icon={<ClearOutlined />} onClick={onOpenCleanup} aria-label="Clean up workspaces" />
        </Tooltip>
      </div>
      <div className="tabbar-actions" data-tauri-drag-region="deep">
        <Tooltip title="New terminal in focused pane">
          <Button type="text" size="small" icon={<PlusOutlined />} onClick={() => newTab()} aria-label="New terminal" />
        </Tooltip>
        <Popover
          trigger="click"
          open={launcherOpen}
          onOpenChange={(open) => {
            setLauncherOpen(open);
            if (open) {
              setLauncherQuery("");
              setLauncherIndex(0);
            }
          }}
          placement="bottomRight"
          content={(
            <div className="launcher-popover">
              <Input
                size="small"
                autoFocus
                placeholder="Search runnables"
                value={launcherQuery}
                onChange={(event) => setLauncherQuery(event.target.value)}
                onKeyDown={handleLauncherKeyDown}
                allowClear
              />
              <div className="launcher-list">
                {filteredRunnables.length === 0 ? (
                  <div className="launcher-empty">No runnables match</div>
                ) : filteredRunnables.map((runnable, index) => (
                  <button
                    key={runnable.id}
                    type="button"
                    className={`launcher-row${index === launcherIndex ? " launcher-row-active" : ""}`}
                    onClick={() => launch(runnable.commands)}
                    onMouseEnter={() => setLauncherIndex(index)}
                  >
                    <span className="launcher-name">{runnable.name}</span>
                    <span className="launcher-commands">{runnable.commands.join("  ")}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        >
          <Tooltip title="Run an app">
            <Button type="text" size="small" icon={<RocketOutlined />} aria-label="Run an app" />
          </Tooltip>
        </Popover>
        <Tooltip title="Toggle vertical split">
          <Button
            type="text"
            size="small"
            icon={<ColumnWidthOutlined />}
            onClick={toggleVertical}
            style={{ color: state.vertical ? palette.primary : undefined }}
            aria-label="Toggle vertical split"
          />
        </Tooltip>
        <Tooltip title="Toggle bottom split">
          <Button
            type="text"
            size="small"
            icon={<InsertRowBelowOutlined />}
            onClick={toggleBottom}
            style={{ color: state.bottom ? palette.primary : undefined }}
            aria-label="Toggle bottom split"
          />
        </Tooltip>
      </div>
      {showWindowControls && controlsSide === "right" && <WindowControls side="right" />}
    </div>
  );
}

export default TerminalTabBar;
