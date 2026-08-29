import type {
  QuizQuestion,
  QuizQuestionRepository,
} from "../application/quiz-questions";

export class MemoryQuizQuestionRepository implements QuizQuestionRepository {
  private readonly questions: QuizQuestion[] = [];

  async create(question: QuizQuestion) {
    this.questions.push(structuredClone(question));
    return structuredClone(question);
  }

  async get(quizId: string, id: string) {
    return structuredClone(
      this.questions.find(
        (question) => question.quizId === quizId && question.id === id,
      ),
    );
  }

  async list(quizId: string) {
    return structuredClone(
      this.questions.filter((question) => question.quizId === quizId),
    );
  }

  async update(quizId: string, id: string, question: QuizQuestion) {
    const index = this.questions.findIndex(
      (candidate) => candidate.quizId === quizId && candidate.id === id,
    );
    if (index === -1) return undefined;
    const updated = { ...question, quizId, id };
    this.questions[index] = structuredClone(updated);
    return structuredClone(updated);
  }

  async delete(quizId: string, id: string) {
    const index = this.questions.findIndex(
      (question) => question.quizId === quizId && question.id === id,
    );
    if (index === -1) return false;
    this.questions.splice(index, 1);
    return true;
  }

  setRecallStreak(id: string, recallStreak: number) {
    const question = this.questions.find((candidate) => candidate.id === id);
    if (question) question.recallStreak = recallStreak;
  }
}
