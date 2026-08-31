import { getPostgresQuizStudyRepository } from "../adapters/persistence/postgres/database";
import { createQuizStudyService } from "../application/quiz-study";

export function getQuizStudyService() {
  return createQuizStudyService(getPostgresQuizStudyRepository());
}
