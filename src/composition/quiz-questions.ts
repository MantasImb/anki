import { getPostgresQuizQuestionRepository } from "../adapters/persistence/postgres/database";
import { createQuizQuestionService } from "../application/quiz-questions";

export function getQuizQuestionService() {
  return createQuizQuestionService(getPostgresQuizQuestionRepository());
}
