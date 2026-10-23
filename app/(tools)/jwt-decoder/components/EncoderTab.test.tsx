import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ToastProvider } from "@/components/shared/Toast";
import { EncoderTab } from "./EncoderTab";

describe("EncoderTab accessible labels", () => {
  afterEach(cleanup);

  it("gives the algorithm dropdown an accessible name", () => {
    render(
      <ToastProvider>
        <EncoderTab />
      </ToastProvider>
    );

    expect(
      screen.getByRole("combobox", { name: "Algorithm" })
    ).toBeInTheDocument();
  });

  it("gives the template dropdown an accessible name", () => {
    render(
      <ToastProvider>
        <EncoderTab />
      </ToastProvider>
    );

    expect(
      screen.getByRole("combobox", { name: "Payload template" })
    ).toBeInTheDocument();
  });
});