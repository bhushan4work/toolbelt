import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./TextTab.tsx", import.meta.url), "utf8");

describe("Base64 code-literal disclosure", () => {
  it("keeps the accessible name stable and connects the stateful control to its panel", () => {
    expect(source).toContain('aria-expanded={showLang}');
    expect(source).toContain('aria-controls="base64-code-literal-panel"');
    expect(source).toContain('id="base64-code-literal-panel"');
    expect(source).toContain("Copy as code literal");
    expect(source).not.toContain("click to expand");
  });
});
