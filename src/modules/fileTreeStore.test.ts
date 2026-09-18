import { describe, expect, it, vi } from "vitest";
import { FileTreeStore, type FileEntry } from "./fileTreeStore";

const entry = (relativePath: string): FileEntry => ({
  name: relativePath,
  relativePath,
  isDirectory: false,
  isSymlink: false,
});

describe("FileTreeStore", () => {
  it("preserves state per worktree and coalesces duplicate loads", async () => {
    let resolve!: (value: FileEntry[]) => void;
    const invoke = vi.fn(() => new Promise<FileEntry[]>((done) => { resolve = done; }));
    const store = new FileTreeStore(invoke);

    store.setActiveWorktree("/one");
    const first = store.loadDirectory("/one", "");
    const second = store.loadDirectory("/one", "");
    expect(invoke).toHaveBeenCalledTimes(1);
    resolve([entry("a.txt")]);
    await Promise.all([first, second]);
    store.setExpanded("/one", ["folder"]);
    store.setActiveWorktree("/two");
    store.setActiveWorktree("/one");

    expect(store.getSnapshot().entries[""]).toEqual([entry("a.txt")]);
    expect(store.getSnapshot().expandedKeys).toEqual(["folder"]);
  });

  it("rejects a response that belongs to a no-longer-active worktree", async () => {
    let resolve!: (value: FileEntry[]) => void;
    const invoke = vi.fn(() => new Promise<FileEntry[]>((done) => { resolve = done; }));
    const store = new FileTreeStore(invoke);
    store.setActiveWorktree("/one");
    const request = store.loadDirectory("/one", "");
    store.setActiveWorktree("/two");
    resolve([entry("stale.txt")]);
    await request;

    expect(store.getSnapshot().entries).toEqual({});
  });

  it("invalidates requests across a worktree round trip", async () => {
    const pending: Array<(entries: FileEntry[]) => void> = [];
    const invoke = vi.fn(() => new Promise<FileEntry[]>((resolve) => pending.push(resolve)));
    const store = new FileTreeStore(invoke);

    store.setActiveWorktree("/one");
    const stale = store.loadDirectory("/one", "");
    store.setActiveWorktree("/two");
    store.setActiveWorktree("/one");
    const current = store.loadDirectory("/one", "");

    expect(invoke).toHaveBeenCalledTimes(2);
    pending[1]([entry("current.txt")]);
    await current;
    pending[0]([entry("stale.txt")]);
    await stale;

    expect(store.getSnapshot().entries[""]).toEqual([entry("current.txt")]);
  });
});
