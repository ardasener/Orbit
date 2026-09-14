export interface DropPosition {
  x: number;
  y: number;
}

export interface DropRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Test a physical native-drop position against a CSS-pixel element rect. */
export function isDropInsideRect(
  position: DropPosition,
  rect: DropRect,
  scaleFactor: number,
  origin: DropPosition = { x: 0, y: 0 },
): boolean {
  const scale = scaleFactor > 0 ? scaleFactor : 1;
  const x = (position.x - origin.x) / scale;
  const y = (position.y - origin.y) / scale;
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}
