import { describe, expect, it } from "vitest";
import { GenerationAttemptFailedError } from "../application/generation";
import { submitGenerationRetry } from "./retry-generation";

describe("Generation retry submission", () => {
  it("returns a concise failure state when another attempt fails", async () => {
    const state = await submitGenerationRetry(
      {
        async retry() {
          throw new GenerationAttemptFailedError("source-1", "refusal");
        },
      },
      "deck-a",
      "source-1",
    );

    expect(state).toEqual({ status: "failed" });
  });
});
