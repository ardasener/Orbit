import { describe, expect, it } from "vitest";
import { formatDroppedPaths, quotePosixPath } from "./dropPaths";

describe("quotePosixPath", () => {
  it("quotes an ordinary absolute path", () => {
    expect(quotePosixPath("/Users/alice/project/file.txt")).toBe(
      "'/Users/alice/project/file.txt'",
    );
  });

  it("keeps spaces and shell metacharacters inside one argument", () => {
    expect(quotePosixPath("/Users/alice/My Files/$draft [1].txt")).toBe(
      "'/Users/alice/My Files/$draft [1].txt'",
    );
  });

  it("escapes embedded single quotes", () => {
    expect(quotePosixPath("/Users/alice/it's ready.txt")).toBe(
      "'/Users/alice/it'\\''s ready.txt'",
    );
  });

  it("preserves newlines as literal path content", () => {
    expect(quotePosixPath("/Users/alice/line\nbreak.txt")).toBe(
      "'/Users/alice/line\nbreak.txt'",
    );
  });
});

describe("formatDroppedPaths", () => {
  it("joins every dropped path with one space", () => {
    expect(
      formatDroppedPaths(["/tmp/one.txt", "/tmp/Two Files", "/tmp/three"]),
    ).toBe("'/tmp/one.txt' '/tmp/Two Files' '/tmp/three'");
  });

  it("returns no input for an empty drop", () => {
    expect(formatDroppedPaths([])).toBe("");
  });
});
