import { requireOpenAIConfiguration } from "../generation/openai-configuration";
import { requireDatabaseUrl } from "../persistence/postgres/database-url";
import { requireGoogleTranslationConfiguration } from "../translation/google-translation-configuration";

type DeploymentEnvironment = Readonly<Record<string, string | undefined>>;

function rejectBrowserSecret(
  environment: DeploymentEnvironment,
  name:
    | "NEXT_PUBLIC_DATABASE_URL"
    | "NEXT_PUBLIC_GOOGLE_CLOUD_TRANSLATION_CREDENTIALS"
    | "NEXT_PUBLIC_OPENAI_API_KEY",
  description: string,
) {
  if (environment[name]?.trim()) {
    throw new Error(
      `${name} must not be set because ${description} are server-only.`,
    );
  }
}

export function validateDeploymentConfiguration(
  environment: DeploymentEnvironment,
) {
  rejectBrowserSecret(
    environment,
    "NEXT_PUBLIC_DATABASE_URL",
    "database credentials",
  );
  rejectBrowserSecret(
    environment,
    "NEXT_PUBLIC_OPENAI_API_KEY",
    "provider credentials",
  );
  rejectBrowserSecret(
    environment,
    "NEXT_PUBLIC_GOOGLE_CLOUD_TRANSLATION_CREDENTIALS",
    "provider credentials",
  );

  return {
    databaseUrl: requireDatabaseUrl(environment),
    googleTranslation: requireGoogleTranslationConfiguration(environment),
    openAI: requireOpenAIConfiguration(environment),
  };
}
