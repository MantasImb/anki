import {
  getPostgresFlashcardDeckRepository,
  getPostgresQuizRepository,
} from "../adapters/persistence/postgres/database";
import { createCollectionService } from "../application/collections";

export function getFlashcardDeckService() {
  return createCollectionService(
    "Flashcard Deck",
    getPostgresFlashcardDeckRepository(),
  );
}

export function getQuizService() {
  return createCollectionService("Quiz", getPostgresQuizRepository());
}
