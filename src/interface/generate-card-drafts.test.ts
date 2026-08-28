import { describe, expect, it } from "vitest";
import {
  GenerationAttemptFailedError,
  SourceTextValidationError,
} from "../application/generation";
import { submitGenerationForm } from "./generate-card-drafts";

describe("Card Draft generation form submission", () => {
  it("returns a safe retry path when generation fails", async () => {
    const formData = new FormData();
    formData.set("sourceText", "Drosjesjåføren skal opptre høflig.");

    const state = await submitGenerationForm(
      {
        async generate() {
          throw new GenerationAttemptFailedError("source-1", "timeout");
        },
      },
      "deck-a",
      formData,
    );

    expect(state).toEqual({ status: "failed", sourceTextId: "source-1" });
  });

  it("preserves rejected Source Text and its useful validation error", async () => {
    const formData = new FormData();
    formData.set("sourceText", "for langt innhold");

    const state = await submitGenerationForm(
      {
        async generate() {
          throw new SourceTextValidationError({
            sourceText: "Source Text must be 10 characters or fewer.",
          });
        },
      },
      "deck-a",
      formData,
    );

    expect(state).toEqual({
      status: "invalid",
      fieldErrors: {
        sourceText: "Source Text must be 10 characters or fewer.",
      },
      values: { sourceText: "for langt innhold" },
    });
  });
});
