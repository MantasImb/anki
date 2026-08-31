import { describe, expect, it, vi } from "vitest";
import {
  QuestionTranslationFailure,
  createQuestionTranslationService,
} from "./question-translation";

describe("Question translation", () => {
  it("translates Norwegian plain text in one ordered request", async () => {
    const translate = vi.fn(async () => [
      "What does polite mean?",
      "friendly",
      "angry",
    ]);
    const translations = createQuestionTranslationService({ translate });

    await expect(
      translations.translate([
        "Hva betyr høflig?",
        "vennlig",
        "sint",
      ]),
    ).resolves.toEqual([
      "What does polite mean?",
      "friendly",
      "angry",
    ]);
    expect(translate).toHaveBeenCalledWith([
      "Hva betyr høflig?",
      "vennlig",
      "sint",
    ]);
  });

  it("rejects an incomplete provider response through an application-level failure", async () => {
    const translations = createQuestionTranslationService({
      translate: async () => ["What does polite mean?"],
    });

    await expect(
      translations.translate(["Hva betyr høflig?", "vennlig"]),
    ).rejects.toEqual(
      new QuestionTranslationFailure(
        "incomplete_response",
        "Automatic translation returned incomplete English text.",
      ),
    );
  });
});
