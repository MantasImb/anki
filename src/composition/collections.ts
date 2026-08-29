import {
  getPostgresFlashcardDeckRepository,
  getPostgresQuizRepository,
} from "../adapters/persistence/postgres/database";
import { createCollectionService } from "../application/collections";
import { getQuestionImageService } from "./question-images";

export function getFlashcardDeckService() {
  return createCollectionService(
    "Flashcard Deck",
    getPostgresFlashcardDeckRepository(),
  );
}

export function getQuizService() {
  return createCollectionService(
    "Quiz",
    getPostgresQuizRepository(),
    () => getQuestionImageService().cleanup(),
  );
}
