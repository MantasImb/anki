import { describe, expect, it } from "vitest";
import {
  getMaximumSourceTextCharacters,
  requireOpenAIConfiguration,
} from "./openai-configuration";

describe("OpenAI deployment configuration", () => {
  it("provides the form guardrail without requiring provider credentials", () => {
    expect(getMaximumSourceTextCharacters({})).toBe(20_000);
  });

  it("returns the configured API key, model, and Source Text guardrail", () => {
    expect(
      requireOpenAIConfiguration({
        OPENAI_API_KEY: "test-key",
        OPENAI_MODEL: "configured-model",
        SOURCE_TEXT_MAX_CHARACTERS: "12000",
      }),
    ).toEqual({
      apiKey: "test-key",
      model: "configured-model",
      maximumSourceTextCharacters: 12_000,
    });
  });

  it.each([
    [{ OPENAI_MODEL: "configured-model" }, "OPENAI_API_KEY is required."],
    [{ OPENAI_API_KEY: "test-key" }, "OPENAI_MODEL is required."],
    [
      {
        OPENAI_API_KEY: "test-key",
        OPENAI_MODEL: "configured-model",
        SOURCE_TEXT_MAX_CHARACTERS: "many",
      },
      "SOURCE_TEXT_MAX_CHARACTERS must be a positive integer.",
    ],
  ])("fails clearly for invalid deployment configuration", (environment, message) => {
    expect(() => requireOpenAIConfiguration(environment)).toThrow(message);
  });
});
