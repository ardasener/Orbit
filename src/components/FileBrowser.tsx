import { useCallback, useEffect, useMemo, useRef } from "react";
import { CopyOutlined, EditOutlined, EyeOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Dropdown, Empty, message, Spin, Tree } from "antd";
import type { MenuProps, TreeDataNode, TreeProps } from "antd";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { useSettings, type FileClickAction } from "../settings/SettingsContext";
import { useTerminalLayout } from "../layout/TerminalLayoutContext";
import { fileToolCommand } from "../modules/fileBrowser";
import { FileTreeStore, useFileTreeStore, type FileEntry } from "../modules/fileTreeStore";

interface FilesChangedEvent { worktree: string; paths: string[]; error: string | null }

function parentPath(path: string): string {
  const index = path.lastIndexOf("/");
  return index < 0 ? "" : path.slice(0, index);
}

const fileTreeStore = new FileTreeStore((command, args) => invoke<FileEntry[]>(command, args));

export default function FileBrowser() {
  const { activeWorktree, launchRunnable } = useTerminalLayout();
  const { settings } = useSettings();
  const tree = useFileTreeStore(fileTreeStore, activeWorktree);
  const expandedRef = useRef(tree.expandedKeys);
  useEffect(() => {
    expandedRef.current = tree.expandedKeys;
  }, [tree.expandedKeys]);
  const rootEntries = tree.entries[""];

  useEffect(() => {
    if (activeWorktree && !rootEntries) void fileTreeStore.loadDirectory(activeWorktree, "");
  }, [activeWorktree, rootEntries]);

  useEffect(() => {
    if (!activeWorktree) return;
    let cancelled = false;
    let unlisten: (() => void) | undefined;
    void (async () => {
      try {
         await invoke("files_watch_start", { worktree: activeWorktree });
        if (cancelled) {
          // Cleanup may have raced the async start; stop again after it
          // completes so a late start cannot leave a watcher installed.
          await invoke("files_watch_stop").catch(() => undefined);
          return;
        }
         const registeredUnlisten = await listen<FilesChangedEvent>("files-changed", (event) => {
           if (cancelled) return;
           const payload = event.payload;
          if (payload.worktree !== activeWorktree) return;
           if (payload.error) void message.error(payload.error);
           const affected = new Set<string>();
           const entries = fileTreeStore.getSnapshot().entries;
           for (const changed of payload.paths) {
             let candidate = changed;
             while (true) {
              if (candidate === "" || expandedRef.current.includes(candidate) || entries[candidate] !== undefined) affected.add(candidate);
              if (!candidate) break;
              candidate = parentPath(candidate);
            }
           }
           for (const path of affected) {
             if (entries[path] !== undefined) void fileTreeStore.loadDirectory(activeWorktree, path);
           }
         });
         if (cancelled) registeredUnlisten();
         else unlisten = registeredUnlisten;
      } catch (error) {
        if (!cancelled) void message.error(String(error));
      }
    })();
    return () => {
      cancelled = true;
      unlisten?.();
      void invoke("files_watch_stop").catch(() => undefined);
    };
  }, [activeWorktree]);

  useEffect(() => {
    if (tree.error) void message.error(tree.error);
  }, [tree.error]);

  const copy = useCallback(async (entry: FileEntry, absolute: boolean) => {
    const info = await invoke<{ absolutePath: string; relativePath: string }>("files_resolve_path", {
      worktree: activeWorktree, relativePath: entry.relativePath,
    });
    await writeText(absolute ? info.absolutePath : info.relativePath);
  }, [activeWorktree]);

  const runTool = useCallback(async (entry: FileEntry, action: "view" | "edit") => {
    const info = await invoke<{ absolutePath: string }>("files_resolve_path", {
      worktree: activeWorktree, relativePath: entry.relativePath,
    });
    launchRunnable([fileToolCommand(action === "view" ? settings.fileViewer : settings.fileEditor, info.absolutePath)]);
  }, [activeWorktree, launchRunnable, settings.fileEditor, settings.fileViewer]);

  const performAction = useCallback(async (entry: FileEntry, action: FileClickAction) => {
    try {
      if (action === "copyAbs") await copy(entry, true);
      else if (action === "copyRel") await copy(entry, false);
      else await runTool(entry, action);
    } catch (error) { void message.error(String(error)); }
  }, [copy, runTool]);

  const menu = useCallback((entry: FileEntry): MenuProps => ({ items: [
    ...(entry.isDirectory ? [] : [
      { key: "view", icon: <EyeOutlined />, label: "View", onClick: () => void performAction(entry, "view") },
      { key: "edit", icon: <EditOutlined />, label: "Edit", onClick: () => void performAction(entry, "edit") },
    ]),
    { key: "copyAbs", icon: <CopyOutlined />, label: "Copy Abs. Path", onClick: () => void performAction(entry, "copyAbs") },
    { key: "copyRel", icon: <CopyOutlined />, label: "Copy Rel. Path", onClick: () => void performAction(entry, "copyRel") },
  ] }), [performAction]);

  const buildTree = useCallback((path: string): TreeDataNode[] => (tree.entries[path] ?? []).map((entry) => ({
    key: entry.relativePath,
    isLeaf: !entry.isDirectory,
    title: <Dropdown trigger={["contextMenu"]} menu={menu(entry)}><span title={entry.relativePath}>{entry.name}{entry.isSymlink ? " ↗" : ""}</span></Dropdown>,
    children: entry.isDirectory && tree.expandedKeys.includes(entry.relativePath) ? buildTree(entry.relativePath) : undefined,
  })), [menu, tree.entries, tree.expandedKeys]);
  const treeData = useMemo(() => buildTree(""), [buildTree]);

  const onExpand: TreeProps["onExpand"] = (keys, info) => {
    const next = keys.map(String);
    if (activeWorktree) fileTreeStore.setExpanded(activeWorktree, next);
    if (info.expanded && activeWorktree && typeof info.node.key === "string" && !tree.entries[info.node.key]) {
      void fileTreeStore.loadDirectory(activeWorktree, info.node.key);
    }
  };
  const onSelect: TreeProps["onSelect"] = (keys, info) => {
    if (!activeWorktree) return;
    const key = String(keys[0] ?? "");
    if (!key) return;
    fileTreeStore.setSelected(activeWorktree, key);
    if (info.node.isLeaf) {
      const entry = (tree.entries[parentPath(key)] ?? []).find((item) => item.relativePath === key);
      if (entry) void performAction(entry, settings.fileClickAction);
    }
  };

  if (!activeWorktree) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Select a worktree to browse files" />;
  return <div className="file-browser">
    <div className="file-browser-toolbar">
      <span className="file-browser-root" title={activeWorktree}>{activeWorktree}</span>
      <Button type="text" size="small" icon={<ReloadOutlined spin={tree.loading} />} onClick={() => void fileTreeStore.refreshLoaded(activeWorktree)} aria-label="Refresh files" />
    </div>
    {tree.loading && !tree.entries[""] ? <Spin size="small" /> : <Tree treeData={treeData} expandedKeys={tree.expandedKeys} selectedKeys={tree.selectedKey ? [tree.selectedKey] : []} onExpand={onExpand} onSelect={onSelect} blockNode showLine />}
  </div>;
}
