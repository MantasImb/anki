import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { requireDatabaseUrl } from "./database-url";
import { withDatabaseDiagnostics } from "./database-diagnostics";
import { createDrizzleFlashcardRepository } from "./flashcard-repository";
import { createDrizzleCardDraftReviewRepository } from "./card-draft-review-repository";
import { createDrizzleGenerationInstructionsRepository } from "./generation-instructions-repository";
import { createDrizzleGenerationRepository } from "./generation-repository";
import { createDrizzleStudyRepository } from "./study-repository";
import {
  createDrizzleFlashcardDeckRepository,
  createDrizzleQuizRepository,
} from "./collection-repository";
import * as schema from "./schema";

let client: ReturnType<typeof postgres> | undefined;

const databaseLogger = {
  databaseFailed(event: {
    repository: string;
    operation: string;
    errorType: string;
    code?: string;
    constraint?: string;
  }) {
    console.error("Database operation failed", event);
  },
};

function diagnose<T extends object>(repository: T, name: string): T {
  return withDatabaseDiagnostics(repository, name, databaseLogger);
}

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
  return diagnose(
    createDrizzleFlashcardRepository(getDatabase()),
    "flashcards",
  );
}

export function getPostgresCardDraftReviewRepository() {
  return diagnose(
    createDrizzleCardDraftReviewRepository(getDatabase()),
    "cardDraftReview",
  );
}

export function getPostgresGenerationRepository() {
  return diagnose(
    createDrizzleGenerationRepository(getDatabase()),
    "generation",
  );
}

export function getPostgresGenerationInstructionsRepository() {
  return diagnose(
    createDrizzleGenerationInstructionsRepository(getDatabase()),
    "generationInstructions",
  );
}

export function getPostgresStudyRepository() {
  return diagnose(createDrizzleStudyRepository(getDatabase()), "study");
}

export function getPostgresFlashcardDeckRepository() {
  return diagnose(
    createDrizzleFlashcardDeckRepository(getDatabase()),
    "flashcardDecks",
  );
}

export function getPostgresQuizRepository() {
  return diagnose(createDrizzleQuizRepository(getDatabase()), "quizzes");
}
