import { validateDeploymentConfiguration } from "./deployment";

type ReleaseEnvironment = Readonly<Record<string, string | undefined>>;

export function requireReleaseConfiguration(environment: ReleaseEnvironment) {
  const releaseDatabaseUrl = environment.RELEASE_DATABASE_URL?.trim();

  if (!releaseDatabaseUrl) {
    throw new Error(
      "RELEASE_DATABASE_URL is required for release preparation.",
    );
  }

  const configuration = validateDeploymentConfiguration({
    ...environment,
    DATABASE_URL: releaseDatabaseUrl,
  });
  const parsedDatabaseUrl = new URL(configuration.databaseUrl);
  const databaseIdentity = `${parsedDatabaseUrl.host}${parsedDatabaseUrl.pathname}`;

  return {
    ...configuration,
    databaseIdentity,
  };
}
