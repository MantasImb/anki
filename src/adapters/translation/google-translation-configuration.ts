const DEFAULT_GOOGLE_TRANSLATION_TIMEOUT_MILLISECONDS = 10_000;

type Environment = Readonly<Record<string, string | undefined>>;

type GoogleServiceAccountCredentials = {
  client_email: string;
  private_key: string;
};

function parseCredentials(value: string): GoogleServiceAccountCredentials {
  try {
    const parsed = JSON.parse(value) as Partial<GoogleServiceAccountCredentials>;
    if (!parsed.client_email?.trim() || !parsed.private_key?.trim()) {
      throw new Error("Incomplete credentials");
    }
    return {
      client_email: parsed.client_email,
      private_key: parsed.private_key,
    };
  } catch {
    throw new Error(
      "GOOGLE_CLOUD_TRANSLATION_CREDENTIALS must be valid service account JSON.",
    );
  }
}

export function requireGoogleTranslationConfiguration(environment: Environment) {
  const projectId = environment.GOOGLE_CLOUD_PROJECT_ID?.trim();
  const credentialsJson =
    environment.GOOGLE_CLOUD_TRANSLATION_CREDENTIALS?.trim();
  const location = environment.GOOGLE_CLOUD_TRANSLATION_LOCATION?.trim() ||
    "global";
  const timeoutMilliseconds =
    environment.GOOGLE_CLOUD_TRANSLATION_TIMEOUT_MS?.trim()
      ? Number(environment.GOOGLE_CLOUD_TRANSLATION_TIMEOUT_MS)
      : DEFAULT_GOOGLE_TRANSLATION_TIMEOUT_MILLISECONDS;

  if (!projectId) throw new Error("GOOGLE_CLOUD_PROJECT_ID is required.");
  if (!credentialsJson) {
    throw new Error("GOOGLE_CLOUD_TRANSLATION_CREDENTIALS is required.");
  }
  if (!Number.isSafeInteger(timeoutMilliseconds) || timeoutMilliseconds <= 0) {
    throw new Error(
      "GOOGLE_CLOUD_TRANSLATION_TIMEOUT_MS must be a positive integer.",
    );
  }

  return {
    credentials: parseCredentials(credentialsJson),
    location,
    projectId,
    timeoutMilliseconds,
  };
}
