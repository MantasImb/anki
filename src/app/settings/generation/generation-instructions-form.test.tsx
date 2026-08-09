// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GenerationInstructionsForm } from "./generation-instructions-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe("Generation Instructions form", () => {
  it("shows the saved instructions with save and restore actions", () => {
    render(
      <GenerationInstructionsForm
        initialInstructions="Prefer short, practical phrases."
        resetAction={vi.fn()}
        saveAction={vi.fn()}
      />,
    );

    expect(
      (screen.getByLabelText("Generation Instructions") as HTMLTextAreaElement)
        .value,
    ).toBe("Prefer short, practical phrases.");
    expect(
      screen.getByRole("button", { name: "Save Instructions" }),
    ).not.toHaveProperty("disabled", true);
    expect(
      screen.getByRole("button", { name: "Restore Default" }),
    ).not.toHaveProperty("disabled", true);
  });
});
