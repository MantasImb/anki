// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GenerationFormState } from "@/interface/generate-card-drafts";
import { GenerationForm } from "./generation-form";

afterEach(cleanup);

describe("Generation form", () => {
  it("communicates progress and prevents duplicate submission while generating", async () => {
    let finishGeneration!: (state: GenerationFormState) => void;
    const action = vi.fn(
      () =>
        new Promise<GenerationFormState>((resolve) => {
          finishGeneration = resolve;
        }),
    );
    render(<GenerationForm action={action} maximumCharacters={20_000} />);

    await userEvent.type(
      screen.getByLabelText("Norwegian Source Text"),
      "Drosjesjåføren skal opptre høflig.",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Generate Card Drafts" }),
    );

    const pendingButton = await screen.findByRole("button", {
      name: "Generating Card Drafts…",
    });
    expect(pendingButton.hasAttribute("disabled")).toBe(true);
    await userEvent.click(pendingButton);
    expect(action).toHaveBeenCalledTimes(1);

    await act(async () => {
      finishGeneration({ status: "generated", sourceTextId: "source-1" });
    });
  });
});
