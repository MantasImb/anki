import { describe, expect, it } from "vitest";
import { SourceTextValidationError } from "../application/generation";
import { submitGenerationForm } from "./generate-card-drafts";

describe("Card Draft generation form submission", () => {
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
