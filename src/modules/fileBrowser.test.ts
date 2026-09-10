import { describe, expect, it } from "vitest";
import { fileToolCommand, shellQuote } from "./fileBrowser";

describe("file browser terminal commands", () => {
  it("quotes executable and path as shell words", () => {
    expect(fileToolCommand("my viewer", "/tmp/a file's.txt")).toBe("'my viewer' -- '/tmp/a file'\\''s.txt'");
  });

  it("uses the viewer fallback for blank tools", () => {
    expect(fileToolCommand("  ", "/tmp/file")).toBe("'view' -- '/tmp/file'");
  });

  it("quotes standalone shell values", () => {
    expect(shellQuote("a;b")).toBe("'a;b'");
  });
});
