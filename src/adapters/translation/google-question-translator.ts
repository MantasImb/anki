import {
  QuestionTranslationFailure,
  type NorwegianToEnglishTranslator,
} from "../../application/question-translation";

type TranslationResponse = {
  translations?: Array<{ translatedText?: string | null } | null> | null;
};

type GoogleTranslationClient = {
  translateText(
    request: {
      parent: string;
      contents: string[];
      mimeType: "text/plain";
      sourceLanguageCode: "nb";
      targetLanguageCode: "en";
    },
    options: { timeout: number },
  ): Promise<[TranslationResponse, ...unknown[]]>;
};

export function createGoogleQuestionTranslator({
  client,
  location,
  logger,
  projectId,
  timeoutMilliseconds,
}: {
  client: GoogleTranslationClient;
  location: string;
  logger?: {
    translationFailed(event: Readonly<Record<string, unknown>>): void;
  };
  projectId: string;
  timeoutMilliseconds: number;
}): NorwegianToEnglishTranslator {
  return {
    async translate(norwegianValues) {
      try {
        const [response] = await client.translateText(
          {
            parent: `projects/${projectId}/locations/${location}`,
            contents: [...norwegianValues],
            mimeType: "text/plain",
            sourceLanguageCode: "nb",
            targetLanguageCode: "en",
          },
          { timeout: timeoutMilliseconds },
        );
        const englishValues = (response.translations ?? []).map(
          (translation) => translation?.translatedText ?? "",
        );
        if (
          englishValues.length !== norwegianValues.length ||
          englishValues.some((value) => !value.trim())
        ) {
          throw new QuestionTranslationFailure(
            "incomplete_response",
            "Automatic translation returned incomplete English text.",
          );
        }
        return englishValues;
      } catch (error) {
        if (error instanceof QuestionTranslationFailure) throw error;
        const providerError = error as { code?: unknown; name?: unknown };
        logger?.translationFailed({
          provider: "google-cloud-translation",
          errorType:
            typeof providerError?.name === "string"
              ? providerError.name
              : undefined,
          code: providerError?.code,
        });
        if (
          providerError?.code === 4 ||
          providerError?.name === "DeadlineExceededError"
        ) {
          throw new QuestionTranslationFailure(
            "timeout",
            "Automatic translation timed out. Try again or enter English manually.",
          );
        }
        throw new QuestionTranslationFailure(
          "provider_error",
          "Automatic translation is unavailable.",
        );
      }
    },
  };
}
