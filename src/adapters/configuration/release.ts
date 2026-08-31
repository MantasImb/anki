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

export function requireReleaseCutoverConfiguration(
  environment: ReleaseEnvironment,
) {
  const configuration = requireReleaseConfiguration(environment);
  const confirmation = environment.RELEASE_DATABASE_CONFIRMATION?.trim();

  if (confirmation !== configuration.databaseIdentity) {
    throw new Error(
      `RELEASE_DATABASE_CONFIRMATION must exactly match ${configuration.databaseIdentity}.`,
    );
  }

  if (environment.RELEASE_TRAFFIC_ISOLATED?.trim() !== "true") {
    throw new Error(
      "RELEASE_TRAFFIC_ISOLATED must be true before resetting the release database.",
    );
  }

  return configuration;
}
