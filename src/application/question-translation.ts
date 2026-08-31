export interface NorwegianToEnglishTranslator {
  translate(norwegianValues: readonly string[]): Promise<string[]>;
}

export type QuestionTranslationFailureCategory =
  | "configuration"
  | "incomplete_response"
  | "provider_error"
  | "timeout";

export class QuestionTranslationFailure extends Error {
  constructor(
    readonly category: QuestionTranslationFailureCategory,
    message: string,
    readonly diagnostic?: Readonly<Record<string, unknown>>,
  ) {
    super(message);
    this.name = "QuestionTranslationFailure";
  }
}

export function createQuestionTranslationService(
  translator: NorwegianToEnglishTranslator,
) {
  return {
    async translate(norwegianValues: readonly string[]) {
      const englishValues = await translator.translate(norwegianValues);
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
    },
  };
}
