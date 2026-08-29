import type { AnswerOption, QuizQuestion } from "./quiz-questions";
import { calculateLearningProgress } from "./learning-progress";
import { createStudyScheduler, type StudyAssessment } from "./study";

export type QuizStudyAnswerOption = Omit<AnswerOption, "isCorrect">;
export type QuizStudyQuestion = Omit<QuizQuestion, "options"> & {
  options: QuizStudyAnswerOption[];
};

export function prepareQuizStudyQuestion(
  question: QuizQuestion,
): QuizStudyQuestion {
  return {
    ...question,
    options: question.options.map(
      ({ id, norwegian, english, position }) => ({
        id,
        norwegian,
        english,
        position,
      }),
    ),
  };
}

export type QuizResult = {
  id: string;
  questionId: string | null;
  outcome: StudyAssessment;
  translationHelpUsed: boolean;
  createdAt: Date;
};

export type RecordedQuizResult = QuizResult & {
  recallStreak: number;
  correctOptionId: string;
};

export type RecordQuizResult = {
  id: string;
  quizId: string;
  questionId: string;
  selectedOptionId: string;
  translationHelpUsed: boolean;
};

export interface QuizStudyRepository {
  questions(quizId: string): Promise<QuizQuestion[]>;
  history(): Promise<QuizResult[]>;
  recordResult(input: RecordQuizResult): Promise<RecordedQuizResult>;
}

export function createQuizStudyService(repository: QuizStudyRepository) {
  return {
    questions(quizId: string) {
      return repository.questions(quizId);
    },
    history() {
      return repository.history();
    },
    recordResult(input: RecordQuizResult) {
      return repository.recordResult(input);
    },
  };
}

export function createQuizStudyScheduler(random: () => number = Math.random) {
  return createStudyScheduler(random);
}

export function calculateQuizProgress(questions: QuizQuestion[]) {
  return calculateLearningProgress(questions);
}

export function shuffleAnswerOptions<T>(
  options: readonly T[],
  random: () => number = Math.random,
): T[] {
  const shuffled = [...options];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

export function gradeSingleAnswer(
  options: Array<Pick<AnswerOption, "id" | "isCorrect">>,
  selectedOptionId: string,
  translationHelpUsed: boolean,
): StudyAssessment {
  if (translationHelpUsed) return "incorrect";
  return options.some(
    ({ id, isCorrect }) => id === selectedOptionId && isCorrect,
  )
    ? "correct"
    : "incorrect";
}
