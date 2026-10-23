import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { OutputPanel } from "./OutputPanel";

describe("OutputPanel view switch", () => {
  // Vitest globals are off, so Testing Library does not clean up on its own.
  afterEach(cleanup);

  it("presses only the selected view", () => {
    render(<OutputPanel output={'{\n  "a": 1\n}'} />);
    expect(screen.getByRole("group", { name: "View mode" })).toBeInTheDocument();
    const code = screen.getByRole("button", { name: "Code" });
    const tree = screen.getByRole("button", { name: "Tree" });
    expect(code).toHaveAttribute("aria-pressed", "true");
    expect(tree).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(tree);
    expect(code).toHaveAttribute("aria-pressed", "false");
    expect(tree).toHaveAttribute("aria-pressed", "true");
  });
});
