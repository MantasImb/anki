type DatabaseDiagnostic = {
  code?: string;
  constraint?: string;
};

type DatabaseFailureEvent = DatabaseDiagnostic & {
  errorType: string;
  operation: string;
  repository: string;
};

type DatabaseLogger = {
  databaseFailed(event: DatabaseFailureEvent): void;
};

export class DatabaseOperationError extends Error {
  constructor() {
    super("A database operation failed.");
    this.name = "DatabaseOperationError";
  }
}

function diagnosticFrom(error: unknown): DatabaseDiagnostic | undefined {
  let candidate = error;

  for (let depth = 0; depth < 5 && candidate instanceof Error; depth += 1) {
    const details = candidate as Error & DatabaseDiagnostic;
    if (typeof details.code === "string" || typeof details.constraint === "string") {
      return {
        code: typeof details.code === "string" ? details.code : undefined,
        constraint:
          typeof details.constraint === "string"
            ? details.constraint
            : undefined,
      };
    }
    candidate = details.cause;
  }

  return undefined;
}

export function withDatabaseDiagnostics<T extends object>(
  repository: T,
  repositoryName: string,
  logger: DatabaseLogger,
): T {
  return new Proxy(repository, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== "function") {
        return value;
      }

      return (...args: unknown[]) =>
        Promise.resolve(value.apply(target, args)).catch((error: unknown) => {
          const diagnostic = diagnosticFrom(error);
          if (!diagnostic) {
            throw error;
          }

          try {
            logger.databaseFailed({
              repository: repositoryName,
              operation: String(property),
              errorType: error instanceof Error ? error.name : "UnknownError",
              ...diagnostic,
            });
          } catch {
            // Diagnostics must never replace the safe application failure.
          }

          throw new DatabaseOperationError();
        });
    },
  });
}
