/** Quote one path as a literal POSIX shell argument. */
export function quotePosixPath(path: string): string {
  return `'${path.replace(/'/g, "'\\''")}'`;
}

/** Format native file-drop paths for insertion into a terminal prompt. */
export function formatDroppedPaths(paths: readonly string[]): string {
  return paths.map(quotePosixPath).join(" ");
}
