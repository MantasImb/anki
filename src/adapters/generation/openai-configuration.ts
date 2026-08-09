const DEFAULT_MAXIMUM_SOURCE_TEXT_CHARACTERS = 20_000;

type Environment = Record<string, string | undefined>;

export function getMaximumSourceTextCharacters(environment: Environment) {
  const configuredMaximum = environment.SOURCE_TEXT_MAX_CHARACTERS?.trim();
  const maximumSourceTextCharacters = configuredMaximum
    ? Number(configuredMaximum)
    : DEFAULT_MAXIMUM_SOURCE_TEXT_CHARACTERS;

  if (
    !Number.isSafeInteger(maximumSourceTextCharacters) ||
    maximumSourceTextCharacters <= 0
  ) {
    throw new Error("SOURCE_TEXT_MAX_CHARACTERS must be a positive integer.");
  }

  return maximumSourceTextCharacters;
}

export function requireOpenAIConfiguration(environment: Environment) {
  const apiKey = environment.OPENAI_API_KEY?.trim();
  const model = environment.OPENAI_MODEL?.trim();
  const maximumSourceTextCharacters =
    getMaximumSourceTextCharacters(environment);

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required.");
  }

  if (!model) {
    throw new Error("OPENAI_MODEL is required.");
  }

  return { apiKey, model, maximumSourceTextCharacters };
}
