import { and, asc, eq, inArray } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type {
  AnswerOption,
  QuizQuestion,
  QuizQuestionRepository,
} from "../../../application/quiz-questions";
import * as schema from "./schema";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

const questionSelection = {
  id: schema.quizQuestions.id,
  quizId: schema.quizQuestions.quizId,
  promptNorwegian: schema.quizQuestions.promptNorwegian,
  promptEnglish: schema.quizQuestions.promptEnglish,
  recallStreak: schema.quizQuestions.recallStreak,
};

const optionSelection = {
  id: schema.answerOptions.id,
  questionId: schema.answerOptions.questionId,
  norwegian: schema.answerOptions.norwegian,
  english: schema.answerOptions.english,
  isCorrect: schema.answerOptions.isCorrect,
  position: schema.answerOptions.position,
};

type StoredQuestion = Omit<QuizQuestion, "choiceType" | "options">;
type StoredOption = AnswerOption & { questionId: string };

function deriveChoiceType(options: Array<Pick<AnswerOption, "isCorrect">>) {
  return options.filter(({ isCorrect }) => isCorrect).length === 1
    ? "single" as const
    : "multiple" as const;
}

function withDerivedChoiceType(question: QuizQuestion): QuizQuestion {
  return { ...question, choiceType: deriveChoiceType(question.options) };
}

function hydrate(question: StoredQuestion, options: StoredOption[]): QuizQuestion {
  const questionOptions = options
    .filter(({ questionId }) => questionId === question.id)
    .sort((left, right) => left.position - right.position)
    .map(({ id, norwegian, english, isCorrect, position }) => ({
      id,
      norwegian,
      english,
      isCorrect,
      position,
    }));
  return {
    ...question,
    choiceType: deriveChoiceType(questionOptions),
    options: questionOptions,
  };
}

export function createDrizzleQuizQuestionRepository<
  TResult extends PgQueryResultHKT,
>(database: PgDatabase<TResult, typeof schema>): QuizQuestionRepository {
  async function optionsFor(questionIds: string[]) {
    if (questionIds.length === 0) return [];
    return database
      .select(optionSelection)
      .from(schema.answerOptions)
      .where(inArray(schema.answerOptions.questionId, questionIds))
      .orderBy(
        asc(schema.answerOptions.questionId),
        asc(schema.answerOptions.position),
      );
  }

  return {
    async create(question) {
      await database.transaction(async (transaction) => {
        await transaction.insert(schema.quizQuestions).values({
          id: question.id,
          quizId: question.quizId,
          promptNorwegian: question.promptNorwegian,
          promptEnglish: question.promptEnglish,
          recallStreak: question.recallStreak,
        });
        await transaction.insert(schema.answerOptions).values(
          question.options.map((option) => ({
            ...option,
            questionId: question.id,
          })),
        );
      });
      return withDerivedChoiceType(question);
    },

    async get(quizId, id) {
      if (!isUuid(quizId) || !isUuid(id)) return undefined;
      const [question] = await database
        .select(questionSelection)
        .from(schema.quizQuestions)
        .where(
          and(
            eq(schema.quizQuestions.quizId, quizId),
            eq(schema.quizQuestions.id, id),
          ),
        );
      if (!question) return undefined;
      return hydrate(question, await optionsFor([question.id]));
    },

    async list(quizId) {
      if (!isUuid(quizId)) return [];
      const questions = await database
        .select(questionSelection)
        .from(schema.quizQuestions)
        .where(eq(schema.quizQuestions.quizId, quizId))
        .orderBy(asc(schema.quizQuestions.createdAt), asc(schema.quizQuestions.id));
      const options = await optionsFor(questions.map(({ id }) => id));
      return questions.map((question) => hydrate(question, options));
    },

    async update(quizId, id, question) {
      if (!isUuid(quizId) || !isUuid(id)) return undefined;
      return database.transaction(async (transaction) => {
        const [storedQuestion] = await transaction
          .update(schema.quizQuestions)
          .set({
            promptNorwegian: question.promptNorwegian,
            promptEnglish: question.promptEnglish,
          })
          .where(
            and(
              eq(schema.quizQuestions.quizId, quizId),
              eq(schema.quizQuestions.id, id),
            ),
          )
          .returning(questionSelection);
        if (!storedQuestion) return undefined;
        await transaction
          .delete(schema.answerOptions)
          .where(eq(schema.answerOptions.questionId, id));
        const storedOptions = await transaction
          .insert(schema.answerOptions)
          .values(
            question.options.map((option) => ({
              ...option,
              questionId: id,
            })),
          )
          .returning(optionSelection);
        return hydrate(storedQuestion, storedOptions);
      });
    },
  };
}
