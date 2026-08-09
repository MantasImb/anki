import { describe, expect, it } from "vitest";
import { submitGenerationInstructionsForm } from "./manage-generation-instructions";

describe("Generation Instructions form submission", () => {
  it("returns the saved instructions for a successful edit", async () => {
    const formData = new FormData();
    formData.set("instructions", "Prefer short, practical phrases.");

    const state = await submitGenerationInstructionsForm(
      {
        async save(instructions) {
          return instructions;
        },
      },
      formData,
    );

    expect(state).toEqual({
      status: "saved",
      values: { instructions: "Prefer short, practical phrases." },
    });
  });
});
