import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { VerifyPanel } from "./VerifyPanel";

// Nothing is verified until a secret or JWKS keys are entered, so no network or crypto runs here.
const TOKEN = "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxIn0.c2ln";

describe("VerifyPanel key source switch", () => {
  // Vitest globals are off, so Testing Library does not clean up on its own.
  afterEach(cleanup);

  it("presses only the selected key source", () => {
    render(<VerifyPanel token={TOKEN} alg="RS256" />);
    expect(screen.getByRole("group", { name: "Key source" })).toBeInTheDocument();
    const pem = screen.getByRole("button", { name: "PEM / JWK" });
    const jwks = screen.getByRole("button", { name: "JWKS URL" });
    expect(pem).toHaveAttribute("type", "button");
    expect(pem).toHaveAttribute("aria-pressed", "true");
    expect(jwks).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(jwks);
    expect(pem).toHaveAttribute("aria-pressed", "false");
    expect(jwks).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps JWKS unpressed and disabled for HMAC tokens", () => {
    render(<VerifyPanel token={TOKEN} alg="HS256" />);
    const jwks = screen.getByRole("button", { name: "JWKS URL" });
    expect(screen.getByRole("button", { name: "Secret" })).toHaveAttribute("aria-pressed", "true");
    expect(jwks).toBeDisabled();
    fireEvent.click(jwks);
    expect(jwks).toHaveAttribute("aria-pressed", "false");
  });
});
