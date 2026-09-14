import { describe, expect, it } from "vitest";
import { isDropInsideRect, type DropPosition, type DropRect } from "./dropTarget";

const rect: DropRect = { left: 100, top: 50, right: 500, bottom: 350 };

describe("isDropInsideRect", () => {
  it("converts physical coordinates using the display scale", () => {
    const position: DropPosition = { x: 600, y: 300 };
    expect(isDropInsideRect(position, rect, 2)).toBe(true);
  });

  it("converts desktop coordinates relative to the webview origin", () => {
    const position: DropPosition = { x: 648, y: -143 };
    const webviewOrigin: DropPosition = { x: -400, y: -265 };
    expect(
      isDropInsideRect(position, { ...rect, right: 800 }, 2, webviewOrigin),
    ).toBe(true);
  });

  it("includes the terminal bounds", () => {
    expect(isDropInsideRect({ x: 100, y: 50 }, rect, 1)).toBe(true);
    expect(isDropInsideRect({ x: 500, y: 350 }, rect, 1)).toBe(true);
  });

  it("rejects positions outside the terminal bounds", () => {
    expect(isDropInsideRect({ x: 99, y: 100 }, rect, 1)).toBe(false);
    expect(isDropInsideRect({ x: 501, y: 100 }, rect, 1)).toBe(false);
  });

  it("falls back to a unit scale for invalid scale values", () => {
    expect(isDropInsideRect({ x: 100, y: 50 }, rect, 0)).toBe(true);
  });
});
