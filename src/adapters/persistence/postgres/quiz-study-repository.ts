import { and, asc, eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { QuizQuestionNotFoundError } from "../../../application/quiz-questions";
import {
  gradeSingleAnswer,
  type QuizResult,
  type QuizStudyRepository,
  type RecordQuizResult,
  type RecordedQuizResult,
} from "../../../application/quiz-study";
import { nextRecallStreak } from "../../../application/study";
import { createDrizzleQuizQuestionRepository } from "./quiz-question-repository";
import * as schema from "./schema";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

const resultSelection = {
  id: schema.quizResults.id,
  questionId: schema.quizResults.questionId,
  outcome: schema.quizResults.outcome,
  translationHelpUsed: schema.quizResults.translationHelpUsed,
  createdAt: schema.quizResults.createdAt,
};

export function createDrizzleQuizStudyRepository<
  TResult extends PgQueryResultHKT,
>(database: PgDatabase<TResult, typeof schema>): QuizStudyRepository {
  const questions = createDrizzleQuizQuestionRepository(database);

  return {
    questions(quizId) {
      return questions.list(quizId);
    },

    history(): Promise<QuizResult[]> {
      return database
        .select(resultSelection)
        .from(schema.quizResults)
        .orderBy(asc(schema.quizResults.createdAt), asc(schema.quizResults.id));
    },

    recordResult(input: RecordQuizResult): Promise<RecordedQuizResult> {
      if (
        !isUuid(input.id) ||
        !isUuid(input.quizId) ||
        !isUuid(input.questionId) ||
        !isUuid(input.selectedOptionId)
      ) {
        return Promise.reject(new QuizQuestionNotFoundError());
      }

      return database.transaction(async (transaction) => {
        const [question] = await transaction
          .select({ recallStreak: schema.quizQuestions.recallStreak })
          .from(schema.quizQuestions)
          .where(
            and(
              eq(schema.quizQuestions.quizId, input.quizId),
              eq(schema.quizQuestions.id, input.questionId),
            ),
          )
          .for("update");
        if (!question) throw new QuizQuestionNotFoundError();

        const options = await transaction
          .select({
            id: schema.answerOptions.id,
            isCorrect: schema.answerOptions.isCorrect,
          })
          .from(schema.answerOptions)
          .where(eq(schema.answerOptions.questionId, input.questionId));
        if (!options.some(({ id }) => id === input.selectedOptionId)) {
          throw new QuizQuestionNotFoundError();
        }
        const correctOptionId = options.find(({ isCorrect }) => isCorrect)?.id;
        if (!correctOptionId) throw new QuizQuestionNotFoundError();

        const outcome = gradeSingleAnswer(
          options,
          input.selectedOptionId,
          input.translationHelpUsed,
        );
        const [created] = await transaction
          .insert(schema.quizResults)
          .values({
            id: input.id,
            questionId: input.questionId,
            outcome,
            translationHelpUsed: input.translationHelpUsed,
          })
          .onConflictDoNothing({ target: schema.quizResults.id })
          .returning(resultSelection);

        if (!created) {
          const [existing] = await transaction
            .select(resultSelection)
            .from(schema.quizResults)
            .where(eq(schema.quizResults.id, input.id));
          if (!existing) {
            throw new Error("Quiz Result could not be inserted or read back.");
          }
          return {
            ...existing,
            recallStreak: question.recallStreak,
            correctOptionId,
          };
        }

        const recallStreak = nextRecallStreak(
          question.recallStreak,
          outcome,
        );
        await transaction
          .update(schema.quizQuestions)
          .set({ recallStreak })
          .where(eq(schema.quizQuestions.id, input.questionId));

        return { ...created, recallStreak, correctOptionId };
      });
    },
  };
}
