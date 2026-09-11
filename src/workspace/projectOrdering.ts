import type { ProjectInfo } from "./WorkspaceContext";

export function sortProjects(projects: ProjectInfo[]): ProjectInfo[] {
  return [...projects].sort((a, b) => {
    if (a.reachable !== b.reachable) return a.reachable ? -1 : 1;
    if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
    const aLabel = a.displayName ?? a.name;
    const bLabel = b.displayName ?? b.name;
    return aLabel.localeCompare(bLabel);
  });
}

export function canForkProject(project: ProjectInfo): boolean {
  return project.reachable && project.isGit;
}
