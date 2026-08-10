type DatabaseEnvironment = Readonly<Record<string, string | undefined>>;

export function requireDatabaseUrl(environment: DatabaseEnvironment): string {
  const databaseUrl = environment.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to persist Flashcards.");
  }

  if (!/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
    throw new Error("DATABASE_URL must be a PostgreSQL connection URL.");
  }

  return databaseUrl;
}
