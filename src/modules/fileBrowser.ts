export function shellQuote(value: string): string {
  return `'${value.split("'").join("'\\''")}'`;
}

export function fileToolCommand(tool: string, absolutePath: string): string {
  return `${shellQuote(tool.trim() || "view")} -- ${shellQuote(absolutePath)}`;
}
