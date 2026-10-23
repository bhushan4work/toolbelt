import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./DecodeTab.tsx", import.meta.url), "utf8");

describe("Base64 hex disclosure", () => {
  it("exposes whether the hex dump is enabled", () => {
    expect(source).toContain("aria-pressed={showHex}");
    expect(source).toContain("setShowHex((v) => !v)");
  });
});
