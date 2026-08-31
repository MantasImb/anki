import { describe, expect, it, vi } from "vitest";
import { createGoogleQuestionTranslator } from "./google-question-translator";

describe("Google Question translator", () => {
  it("sends ordered Norwegian plain text to Cloud Translation Advanced", async () => {
    const translateText = vi.fn(async () => [{
      translations: [
        { translatedText: "What does polite mean?" },
        { translatedText: "friendly" },
      ],
    }]);
    const translator = createGoogleQuestionTranslator({
      client: { translateText },
      location: "global",
      projectId: "learning-project",
      timeoutMilliseconds: 8_000,
    });

    await expect(
      translator.translate(["Hva betyr høflig?", "vennlig"]),
    ).resolves.toEqual(["What does polite mean?", "friendly"]);
    expect(translateText).toHaveBeenCalledWith(
      {
        parent: "projects/learning-project/locations/global",
        contents: ["Hva betyr høflig?", "vennlig"],
        mimeType: "text/plain",
        sourceLanguageCode: "nb",
        targetLanguageCode: "en",
      },
      { timeout: 8_000 },
    );
  });

  it("normalizes timeouts while logging provider diagnostics without sensitive messages", async () => {
    const providerError = Object.assign(new Error("credential detail"), {
      code: 4,
      name: "DeadlineExceededError",
    });
    const translationFailed = vi.fn();
    const translator = createGoogleQuestionTranslator({
      client: { translateText: vi.fn().mockRejectedValue(providerError) },
      location: "global",
      logger: { translationFailed },
      projectId: "learning-project",
      timeoutMilliseconds: 8_000,
    });

    await expect(translator.translate(["vennlig"])).rejects.toMatchObject({
      category: "timeout",
      message: "Automatic translation timed out. Try again or enter English manually.",
    });
    expect(translationFailed).toHaveBeenCalledWith({
      provider: "google-cloud-translation",
      code: 4,
      errorType: "DeadlineExceededError",
    });
    expect(JSON.stringify(translationFailed.mock.calls)).not.toContain(
      "credential detail",
    );
  });

  it("rejects incomplete provider output at the adapter boundary", async () => {
    const translator = createGoogleQuestionTranslator({
      client: {
        translateText: vi.fn(async () => [{
          translations: [{ translatedText: "What is happening?" }],
        }]),
      },
      location: "global",
      projectId: "learning-project",
      timeoutMilliseconds: 8_000,
    });

    await expect(
      translator.translate(["Hva skjer?", "ingenting"]),
    ).rejects.toMatchObject({
      category: "incomplete_response",
      message: "Automatic translation returned incomplete English text.",
    });
  });
});
