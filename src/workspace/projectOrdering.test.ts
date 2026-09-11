import { describe, expect, it } from "vitest";
import { canForkProject, sortProjects } from "./projectOrdering";
import type { ProjectInfo } from "./WorkspaceContext";

function project(name: string, reachable: boolean, favorite = false): ProjectInfo {
  return {
    path: `/Volumes/${name}`,
    name,
    displayName: null,
    favorite,
    isGit: false,
    branch: null,
    worktrees: [],
    reachable,
  };
}

describe("workspace project ordering", () => {
  it("places unreachable projects after reachable projects", () => {
    expect(sortProjects([project("offline", false), project("online", true)]).map((p) => p.name)).toEqual([
      "online",
      "offline",
    ]);
  });

  it("keeps favorite-first ordering within reachability groups", () => {
    expect(
      sortProjects([project("zeta", true), project("alpha", true, true), project("beta", false, true)])
        .map((p) => p.name),
    ).toEqual(["alpha", "zeta", "beta"]);
  });

  it("does not allow forking an unreachable git project", () => {
    expect(canForkProject({ ...project("offline", false), isGit: true })).toBe(false);
    expect(canForkProject({ ...project("online", true), isGit: true })).toBe(true);
  });
});
