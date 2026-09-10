import { useCallback, useEffect, useRef, useState } from "react";
import { CopyOutlined, EditOutlined, EyeOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Dropdown, Empty, message, Spin, Tree } from "antd";
import type { MenuProps, TreeDataNode, TreeProps } from "antd";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { useSettings, type FileClickAction } from "../settings/SettingsContext";
import { useTerminalLayout } from "../layout/TerminalLayoutContext";
import { fileToolCommand } from "../modules/fileBrowser";

interface FileEntry {
  name: string;
  relativePath: string;
  isDirectory: boolean;
  isSymlink: boolean;
}

interface FilesChangedEvent {
  worktree: string;
  paths: string[];
  error: string | null;
}

function parentPath(path: string): string {
  const index = path.lastIndexOf("/");
  return index < 0 ? "" : path.slice(0, index);
}

export default function FileBrowser() {
  const { activeWorktree, launchRunnable } = useTerminalLayout();
  const { settings } = useSettings();
  const [entries, setEntries] = useState<Record<string, FileEntry[]>>({});
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const expandedRef = useRef<string[]>([]);

  const loadDirectory = useCallback(async (path: string, showSpinner = false) => {
    if (!activeWorktree) return;
    if (showSpinner) setLoading(true);
    try {
      const result = await invoke<FileEntry[]>("files_list_directory", {
        worktree: activeWorktree,
        relativePath: path,
      });
      setEntries((previous) => ({ ...previous, [path]: result }));
    } catch (error) {
      void message.error(String(error));
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [activeWorktree]);

  useEffect(() => {
    setEntries({});
    setExpandedKeys([]);
    expandedRef.current = [];
    setSelectedKey(null);
    if (activeWorktree) void loadDirectory("", true);
  }, [activeWorktree, loadDirectory]);

  useEffect(() => {
    if (!activeWorktree) return;
    let unlisten: (() => void) | undefined;
    let cancelled = false;
    void (async () => {
      try {
        await invoke("files_watch_start", { worktree: activeWorktree });
        unlisten = await listen<FilesChangedEvent>("files-changed", (event) => {
          const payload = event.payload;
          if (payload.worktree !== activeWorktree) return;
          if (payload.error) void message.error(payload.error);
          const affected = new Set<string>();
          for (const changed of payload.paths) {
            let candidate = parentPath(changed);
            while (true) {
              if (expandedRef.current.includes(candidate) || candidate === "") affected.add(candidate);
              if (!candidate) break;
              candidate = parentPath(candidate);
            }
          }
          for (const path of affected) void loadDirectory(path);
        });
      } catch (error) {
        if (!cancelled) void message.error(String(error));
      }
    })();
    return () => {
      cancelled = true;
      unlisten?.();
      void invoke("files_watch_stop").catch(() => undefined);
    };
  }, [activeWorktree, loadDirectory]);

  const copy = async (entry: FileEntry, absolute: boolean) => {
    const info = await invoke<{ absolutePath: string; relativePath: string }>("files_resolve_path", {
      worktree: activeWorktree,
      relativePath: entry.relativePath,
    });
    await writeText(absolute ? info.absolutePath : info.relativePath);
  };

  const runTool = async (entry: FileEntry, action: "view" | "edit") => {
    const info = await invoke<{ absolutePath: string }>("files_resolve_path", {
      worktree: activeWorktree,
      relativePath: entry.relativePath,
    });
    launchRunnable([fileToolCommand(action === "view" ? settings.fileViewer : settings.fileEditor, info.absolutePath)]);
  };

  const performAction = async (entry: FileEntry, action: FileClickAction) => {
    try {
      if (action === "copyAbs") await copy(entry, true);
      else if (action === "copyRel") await copy(entry, false);
      else await runTool(entry, action);
    } catch (error) {
      void message.error(String(error));
    }
  };

  const menu = (entry: FileEntry): MenuProps => ({
    items: [
      ...(entry.isDirectory ? [] : [
        { key: "view", icon: <EyeOutlined />, label: "View", onClick: () => void performAction(entry, "view") },
        { key: "edit", icon: <EditOutlined />, label: "Edit", onClick: () => void performAction(entry, "edit") },
      ]),
      { key: "copyAbs", icon: <CopyOutlined />, label: "Copy Abs. Path", onClick: () => void performAction(entry, "copyAbs") },
      { key: "copyRel", icon: <CopyOutlined />, label: "Copy Rel. Path", onClick: () => void performAction(entry, "copyRel") },
    ],
  });

  const buildTree = (path: string): TreeDataNode[] => (entries[path] ?? []).map((entry) => ({
    key: entry.relativePath,
    isLeaf: !entry.isDirectory,
    title: (
      <Dropdown trigger={["contextMenu"]} menu={menu(entry)}>
        <span title={entry.relativePath}>{entry.name}{entry.isSymlink ? " ↗" : ""}</span>
      </Dropdown>
    ),
    children: entry.isDirectory && expandedKeys.includes(entry.relativePath) ? buildTree(entry.relativePath) : undefined,
  }));

  const treeData: TreeDataNode[] = (() => {
    return buildTree("");
  })();

  const onExpand: TreeProps["onExpand"] = (keys, info) => {
    const next = keys.map(String);
    setExpandedKeys(next);
    expandedRef.current = next;
    if (info.expanded && typeof info.node.key === "string" && !entries[info.node.key]) {
      void loadDirectory(info.node.key, true);
    }
  };

  const onSelect: TreeProps["onSelect"] = (keys, info) => {
    const key = String(keys[0] ?? "");
    if (!key) return;
    setSelectedKey(key);
    if (info.node.isLeaf) {
      const entry = (entries[parentPath(key)] ?? []).find((item) => item.relativePath === key);
      if (entry) void performAction(entry, settings.fileClickAction);
    }
  };

  if (!activeWorktree) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Select a worktree to browse files" />;

  return (
    <div className="file-browser">
      <div className="file-browser-toolbar">
        <span className="file-browser-root" title={activeWorktree}>{activeWorktree}</span>
        <Button type="text" size="small" icon={<ReloadOutlined spin={loading} />} onClick={() => void loadDirectory("", true)} aria-label="Refresh files" />
      </div>
      {loading && !entries[""] ? <Spin size="small" /> : <Tree treeData={treeData} expandedKeys={expandedKeys} selectedKeys={selectedKey ? [selectedKey] : []} onExpand={onExpand} onSelect={onSelect} blockNode showLine />}
    </div>
  );
}
