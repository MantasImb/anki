import { and, asc, eq, inArray } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type {
  AnswerOption,
  QuestionImageChange,
  QuizQuestion,
  QuizQuestionRepository,
} from "../../../application/quiz-questions";
import { QuestionImageValidationError } from "../../../application/question-images";
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
  imageObjectKey: schema.quizQuestions.imageObjectKey,
  imageOriginalName: schema.quizQuestions.imageOriginalName,
  imageContentType: schema.quizQuestions.imageContentType,
  imageByteSize: schema.quizQuestions.imageByteSize,
};

const optionSelection = {
  id: schema.answerOptions.id,
  questionId: schema.answerOptions.questionId,
  norwegian: schema.answerOptions.norwegian,
  english: schema.answerOptions.english,
  isCorrect: schema.answerOptions.isCorrect,
  position: schema.answerOptions.position,
};

type StoredQuestion = Omit<QuizQuestion, "choiceType" | "options" | "image"> & {
  imageObjectKey: string | null;
  imageOriginalName: string | null;
  imageContentType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" | null;
  imageByteSize: number | null;
};
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
  const {
    imageObjectKey,
    imageOriginalName,
    imageContentType,
    imageByteSize,
    ...content
  } = question;
  return {
    ...content,
    choiceType: deriveChoiceType(questionOptions),
    options: questionOptions,
    ...(imageObjectKey && imageOriginalName && imageContentType && imageByteSize
      ? {
          image: {
            objectKey: imageObjectKey,
            originalName: imageOriginalName,
            contentType: imageContentType,
            byteSize: imageByteSize,
          },
        }
      : {}),
  };
}

export function createDrizzleQuizQuestionRepository<
  TResult extends PgQueryResultHKT,
>(database: PgDatabase<TResult, typeof schema>): QuizQuestionRepository {
  async function completedUpload(
    transaction: PgDatabase<TResult, typeof schema>,
    uploadId: string,
  ) {
    const [upload] = await transaction
      .update(schema.questionImageUploads)
      .set({ status: "attached" })
      .where(
        and(
          eq(schema.questionImageUploads.id, uploadId),
          eq(schema.questionImageUploads.status, "completed"),
        ),
      )
      .returning({
        objectKey: schema.questionImageUploads.objectKey,
        originalName: schema.questionImageUploads.originalName,
        contentType: schema.questionImageUploads.contentType,
        byteSize: schema.questionImageUploads.byteSize,
      });
    if (!upload) {
      throw new QuestionImageValidationError(
        "Finish uploading the Question Image before saving.",
      );
    }
    return upload;
  }

  function imageColumns(image: {
    objectKey: string;
    originalName: string;
    contentType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
    byteSize: number;
  } | undefined) {
    return image
      ? {
          imageObjectKey: image.objectKey,
          imageOriginalName: image.originalName,
          imageContentType: image.contentType,
          imageByteSize: image.byteSize,
        }
      : {
          imageObjectKey: null,
          imageOriginalName: null,
          imageContentType: null,
          imageByteSize: null,
        };
  }

  async function queueCleanup(
    transaction: PgDatabase<TResult, typeof schema>,
    objectKey: string | null,
  ) {
    if (!objectKey) return;
    await transaction
      .insert(schema.questionImageCleanup)
      .values({ objectKey })
      .onConflictDoNothing();
  }

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
    async create(question, imageUploadId) {
      return database.transaction(async (transaction) => {
        const image = imageUploadId
          ? await completedUpload(transaction, imageUploadId)
          : undefined;
        await transaction.insert(schema.quizQuestions).values({
          id: question.id,
          quizId: question.quizId,
          promptNorwegian: question.promptNorwegian,
          promptEnglish: question.promptEnglish,
          recallStreak: question.recallStreak,
          ...imageColumns(image),
        });
        await transaction.insert(schema.answerOptions).values(
          question.options.map((option) => ({
            ...option,
            questionId: question.id,
          })),
        );
        return withDerivedChoiceType({
          ...question,
          ...(image ? { image } : {}),
        });
      });
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

    async update(
      quizId,
      id,
      question,
      imageChange: QuestionImageChange = { kind: "keep" },
    ) {
      if (!isUuid(quizId) || !isUuid(id)) return undefined;
      return database.transaction(async (transaction) => {
        const [existing] = await transaction
          .select(questionSelection)
          .from(schema.quizQuestions)
          .where(
            and(
              eq(schema.quizQuestions.quizId, quizId),
              eq(schema.quizQuestions.id, id),
            ),
          )
          .for("update");
        if (!existing) return undefined;
        const attached = imageChange.kind === "attach"
          ? await completedUpload(transaction, imageChange.uploadId)
          : undefined;
        const nextImage = imageChange.kind === "keep"
          ? existing.imageObjectKey &&
              existing.imageOriginalName &&
              existing.imageContentType &&
              existing.imageByteSize
            ? {
                objectKey: existing.imageObjectKey,
                originalName: existing.imageOriginalName,
                contentType: existing.imageContentType,
                byteSize: existing.imageByteSize,
              }
            : undefined
          : imageChange.kind === "attach"
            ? attached
            : undefined;
        const [storedQuestion] = await transaction
          .update(schema.quizQuestions)
          .set({
            promptNorwegian: question.promptNorwegian,
            promptEnglish: question.promptEnglish,
            ...imageColumns(nextImage),
          })
          .where(
            and(
              eq(schema.quizQuestions.quizId, quizId),
              eq(schema.quizQuestions.id, id),
            ),
          )
          .returning(questionSelection);
        if (!storedQuestion) return undefined;
        if (
          imageChange.kind !== "keep" &&
          existing.imageObjectKey !== nextImage?.objectKey
        ) {
          await queueCleanup(transaction, existing.imageObjectKey);
        }
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

    async delete(quizId, id) {
      if (!isUuid(quizId) || !isUuid(id)) return false;
      return database.transaction(async (transaction) => {
        const [deleted] = await transaction
          .delete(schema.quizQuestions)
          .where(
            and(
              eq(schema.quizQuestions.quizId, quizId),
              eq(schema.quizQuestions.id, id),
            ),
          )
          .returning({ imageObjectKey: schema.quizQuestions.imageObjectKey });
        if (!deleted) return false;
        await queueCleanup(transaction, deleted.imageObjectKey);
        return true;
      });
    },
  };
}
