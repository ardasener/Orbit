import { useEffect, useSyncExternalStore } from "react";

export interface FileEntry {
  name: string;
  relativePath: string;
  isDirectory: boolean;
  isSymlink: boolean;
}

export interface FileTreeSnapshot {
  entries: Record<string, FileEntry[]>;
  expandedKeys: string[];
  selectedKey: string | null;
  loading: boolean;
  error: string | null;
}

interface WorktreeState extends FileTreeSnapshot {
  generations: Record<string, number>;
  pending: Map<string, Promise<void>>;
}

type DirectoryInvoker = (command: string, args: { worktree: string; relativePath: string }) => Promise<FileEntry[]>;

const emptyState = (): WorktreeState => ({
  entries: {}, expandedKeys: [], selectedKey: null, loading: false, error: null,
  generations: {}, pending: new Map(),
});

export class FileTreeStore {
  private readonly states = new Map<string, WorktreeState>();
  private readonly listeners = new Set<() => void>();
  private activeWorktree: string | null = null;
  private activeEpoch = 0;
  private snapshot: FileTreeSnapshot = emptyState();

  constructor(private readonly invoke: DirectoryInvoker) {}

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): FileTreeSnapshot => this.snapshot;

  setActiveWorktree(worktree: string | null): void {
    if (worktree === this.activeWorktree) return;
    if (this.activeWorktree) {
      const previous = this.state(this.activeWorktree);
      previous.pending.clear();
      previous.loading = false;
    }
    this.activeEpoch += 1;
    this.activeWorktree = worktree;
    this.publish();
  }

  setExpanded(worktree: string, expandedKeys: string[]): void {
    const state = this.state(worktree);
    state.expandedKeys = expandedKeys;
    this.publishIfActive(worktree);
  }

  setSelected(worktree: string, selectedKey: string | null): void {
    const state = this.state(worktree);
    state.selectedKey = selectedKey;
    this.publishIfActive(worktree);
  }

  loadDirectory(worktree: string, path: string): Promise<void> {
    const state = this.state(worktree);
    const existing = state.pending.get(path);
    if (existing) return existing;
    const generation = (state.generations[path] ?? 0) + 1;
    state.generations[path] = generation;
    state.loading = true;
    state.error = null;
    this.publishIfActive(worktree);
    const epoch = this.activeEpoch;
    const request = this.invoke("files_list_directory", { worktree, relativePath: path })
      .then((entries) => {
        if (this.activeWorktree !== worktree || this.activeEpoch !== epoch || state.generations[path] !== generation) return;
        state.entries = { ...state.entries, [path]: entries };
      })
      .catch((error: unknown) => {
        if (this.activeWorktree === worktree && this.activeEpoch === epoch && state.generations[path] === generation) state.error = String(error);
      })
      .finally(() => {
        if (state.pending.get(path) === request) {
          state.pending.delete(path);
          state.loading = state.pending.size > 0;
          this.publishIfActive(worktree);
        }
      });
    state.pending.set(path, request);
    return request;
  }

  refreshLoaded(worktree: string): Promise<void[]> {
    const state = this.state(worktree);
    return Promise.all(Object.keys(state.entries).map((path) => this.loadDirectory(worktree, path)));
  }

  private state(worktree: string): WorktreeState {
    let state = this.states.get(worktree);
    if (!state) {
      state = emptyState();
      this.states.set(worktree, state);
    }
    return state;
  }

  private publishIfActive(worktree: string): void {
    if (this.activeWorktree === worktree) this.publish();
  }

  private publish(): void {
    const state = this.activeWorktree ? this.state(this.activeWorktree) : emptyState();
    this.snapshot = {
      entries: state.entries,
      expandedKeys: state.expandedKeys,
      selectedKey: state.selectedKey,
      loading: state.loading,
      error: state.error,
    };
    for (const listener of this.listeners) listener();
  }
}

export function useFileTreeStore(store: FileTreeStore, worktree: string | null): FileTreeSnapshot {
  useEffect(() => {
    store.setActiveWorktree(worktree);
  }, [store, worktree]);
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
