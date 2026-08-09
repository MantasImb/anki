import { getPostgresFlashcardRepository } from "../adapters/persistence/postgres/database";
import { createFlashcardService } from "../application/flashcards";

export function getFlashcardService() {
  return createFlashcardService(getPostgresFlashcardRepository());
}
