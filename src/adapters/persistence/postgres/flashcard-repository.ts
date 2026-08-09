import { asc, eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type {
  Flashcard,
  FlashcardRepository,
  NewFlashcard,
} from "../../../application/flashcards";
import * as schema from "./schema";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function createDrizzleFlashcardRepository<
  TResult extends PgQueryResultHKT,
>(database: PgDatabase<TResult, typeof schema>): FlashcardRepository {
  return {
    async create(input: NewFlashcard): Promise<Flashcard> {
      const [created] = await database
        .insert(schema.flashcards)
        .values(input)
        .returning({
          id: schema.flashcards.id,
          sourceTextId: schema.flashcards.sourceTextId,
          front: schema.flashcards.front,
          back: schema.flashcards.back,
          recallStreak: schema.flashcards.recallStreak,
        });

      return created;
    },

    async delete(id: string): Promise<boolean> {
      if (!isUuid(id)) {
        return false;
      }

      const deleted = await database
        .delete(schema.flashcards)
        .where(eq(schema.flashcards.id, id))
        .returning({ id: schema.flashcards.id });

      return deleted.length > 0;
    },

    async get(id: string): Promise<Flashcard | undefined> {
      if (!isUuid(id)) {
        return undefined;
      }

      const [flashcard] = await database
        .select({
          id: schema.flashcards.id,
          sourceTextId: schema.flashcards.sourceTextId,
          front: schema.flashcards.front,
          back: schema.flashcards.back,
          recallStreak: schema.flashcards.recallStreak,
        })
        .from(schema.flashcards)
        .where(eq(schema.flashcards.id, id));

      return flashcard;
    },

    list(): Promise<Flashcard[]> {
      return database
        .select({
          id: schema.flashcards.id,
          sourceTextId: schema.flashcards.sourceTextId,
          front: schema.flashcards.front,
          back: schema.flashcards.back,
          recallStreak: schema.flashcards.recallStreak,
        })
        .from(schema.flashcards)
        .orderBy(asc(schema.flashcards.createdAt), asc(schema.flashcards.id));
    },

    async update(
      id: string,
      input: NewFlashcard,
    ): Promise<Flashcard | undefined> {
      if (!isUuid(id)) {
        return undefined;
      }

      const [updated] = await database
        .update(schema.flashcards)
        .set(input)
        .where(eq(schema.flashcards.id, id))
        .returning({
          id: schema.flashcards.id,
          sourceTextId: schema.flashcards.sourceTextId,
          front: schema.flashcards.front,
          back: schema.flashcards.back,
          recallStreak: schema.flashcards.recallStreak,
        });

      return updated;
    },
  };
}
