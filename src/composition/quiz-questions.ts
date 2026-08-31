import { getPostgresQuizQuestionRepository } from "../adapters/persistence/postgres/database";
import { createQuizQuestionService } from "../application/quiz-questions";
import { getQuestionImageService } from "./question-images";

export function getQuizQuestionService() {
  return createQuizQuestionService(
    getPostgresQuizQuestionRepository(),
    () => getQuestionImageService().cleanup(),
  );
}
