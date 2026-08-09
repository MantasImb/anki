import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { requireDatabaseUrl } from "./database-url";
import { createDrizzleFlashcardRepository } from "./flashcard-repository";
import { createDrizzleGenerationInstructionsRepository } from "./generation-instructions-repository";
import { createDrizzleGenerationRepository } from "./generation-repository";
import * as schema from "./schema";

let client: ReturnType<typeof postgres> | undefined;

function getDatabase() {
  const databaseUrl = requireDatabaseUrl(process.env);

  client ??= postgres(databaseUrl, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return drizzle(client, { schema });
}

export function getPostgresFlashcardRepository() {
  return createDrizzleFlashcardRepository(getDatabase());
}

export function getPostgresGenerationRepository() {
  return createDrizzleGenerationRepository(getDatabase());
}

export function getPostgresGenerationInstructionsRepository() {
  return createDrizzleGenerationInstructionsRepository(getDatabase());
}
