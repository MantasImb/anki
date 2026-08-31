import { asc, eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type {
  Collection,
  CollectionRepository,
} from "../../../application/collections";
import * as schema from "./schema";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function createDrizzleFlashcardDeckRepository<
  TResult extends PgQueryResultHKT,
>(database: PgDatabase<TResult, typeof schema>): CollectionRepository {
  return {
    async create(input: Collection & { nameKey: string }) {
      const [created] = await database
        .insert(schema.flashcardDecks)
        .values(input)
        .onConflictDoNothing({ target: schema.flashcardDecks.nameKey })
        .returning({
          id: schema.flashcardDecks.id,
          name: schema.flashcardDecks.name,
        });
      return created;
    },
    async get(id: string) {
      if (!isUuid(id)) {
        return undefined;
      }
      const [deck] = await database
        .select({
          id: schema.flashcardDecks.id,
          name: schema.flashcardDecks.name,
        })
        .from(schema.flashcardDecks)
        .where(eq(schema.flashcardDecks.id, id));
      return deck;
    },
    list() {
      return database
        .select({
          id: schema.flashcardDecks.id,
          name: schema.flashcardDecks.name,
        })
        .from(schema.flashcardDecks)
        .orderBy(
          asc(schema.flashcardDecks.createdAt),
          asc(schema.flashcardDecks.id),
        );
    },
    async delete(id: string) {
      if (!isUuid(id)) return false;
      const deleted = await database
        .delete(schema.flashcardDecks)
        .where(eq(schema.flashcardDecks.id, id))
        .returning({ id: schema.flashcardDecks.id });
      return deleted.length > 0;
    },
  };
}

export function createDrizzleQuizRepository<TResult extends PgQueryResultHKT>(
  database: PgDatabase<TResult, typeof schema>,
): CollectionRepository {
  return {
    async create(input: Collection & { nameKey: string }) {
      const [created] = await database
        .insert(schema.quizzes)
        .values(input)
        .onConflictDoNothing({ target: schema.quizzes.nameKey })
        .returning({ id: schema.quizzes.id, name: schema.quizzes.name });
      return created;
    },
    async get(id: string) {
      if (!isUuid(id)) {
        return undefined;
      }
      const [quiz] = await database
        .select({ id: schema.quizzes.id, name: schema.quizzes.name })
        .from(schema.quizzes)
        .where(eq(schema.quizzes.id, id));
      return quiz;
    },
    list() {
      return database
        .select({ id: schema.quizzes.id, name: schema.quizzes.name })
        .from(schema.quizzes)
        .orderBy(asc(schema.quizzes.createdAt), asc(schema.quizzes.id));
    },
    async delete(id: string) {
      if (!isUuid(id)) return false;
      return database.transaction(async (transaction) => {
        const [quiz] = await transaction
          .select({ id: schema.quizzes.id })
          .from(schema.quizzes)
          .where(eq(schema.quizzes.id, id))
          .for("update");
        if (!quiz) return false;
        const images = await transaction
          .select({ objectKey: schema.quizQuestions.imageObjectKey })
          .from(schema.quizQuestions)
          .where(eq(schema.quizQuestions.quizId, id))
          .for("update");
        const objectKeys = images.flatMap(({ objectKey }) =>
          objectKey ? [{ objectKey }] : []
        );
        if (objectKeys.length > 0) {
          await transaction
            .insert(schema.questionImageCleanup)
            .values(objectKeys)
            .onConflictDoNothing();
        }
        const deleted = await transaction
          .delete(schema.quizzes)
          .where(eq(schema.quizzes.id, id))
          .returning({ id: schema.quizzes.id });
        return deleted.length > 0;
      });
    },
  };
}
