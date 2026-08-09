import { and, asc, eq, gt, or } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { FlashcardNotFoundError, type Flashcard } from "../../../application/flashcards";
import {
  nextRecallStreak,
  type RecordStudyResult,
  type StudyRepository,
  type StudyResult,
} from "../../../application/study";
import * as schema from "./schema";

const selectedFlashcard = {
  id: schema.flashcards.id,
  sourceTextId: schema.flashcards.sourceTextId,
  front: schema.flashcards.front,
  back: schema.flashcards.back,
  recallStreak: schema.flashcards.recallStreak,
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function createDrizzleStudyRepository<
  TResult extends PgQueryResultHKT,
>(database: PgDatabase<TResult, typeof schema>): StudyRepository {
  return {
    async nextCard(afterCardId?: string): Promise<Flashcard | undefined> {
      if (afterCardId && isUuid(afterCardId)) {
        const [cursor] = await database
          .select({
            createdAt: schema.flashcards.createdAt,
            id: schema.flashcards.id,
          })
          .from(schema.flashcards)
          .where(eq(schema.flashcards.id, afterCardId))
          .limit(1);

        if (cursor) {
          const [next] = await database
            .select(selectedFlashcard)
            .from(schema.flashcards)
            .where(
              or(
                gt(schema.flashcards.createdAt, cursor.createdAt),
                and(
                  eq(schema.flashcards.createdAt, cursor.createdAt),
                  gt(schema.flashcards.id, cursor.id),
                ),
              ),
            )
            .orderBy(
              asc(schema.flashcards.createdAt),
              asc(schema.flashcards.id),
            )
            .limit(1);

          if (next) {
            return next;
          }
        }
      }

      const [first] = await database
        .select(selectedFlashcard)
        .from(schema.flashcards)
        .orderBy(asc(schema.flashcards.createdAt), asc(schema.flashcards.id))
        .limit(1);

      return first;
    },

    history(): Promise<StudyResult[]> {
      return database
        .select({
          id: schema.studyResults.id,
          flashcardId: schema.studyResults.flashcardId,
          assessment: schema.studyResults.assessment,
          createdAt: schema.studyResults.createdAt,
        })
        .from(schema.studyResults)
        .orderBy(
          asc(schema.studyResults.createdAt),
          asc(schema.studyResults.id),
        );
    },

    recordResult(input: RecordStudyResult): Promise<StudyResult> {
      return database.transaction(async (transaction) => {
        const [flashcard] = await transaction
          .select({ recallStreak: schema.flashcards.recallStreak })
          .from(schema.flashcards)
          .where(eq(schema.flashcards.id, input.flashcardId))
          .for("update");

        if (!flashcard) {
          throw new FlashcardNotFoundError();
        }

        const [created] = await transaction
          .insert(schema.studyResults)
          .values(input)
          .onConflictDoNothing({ target: schema.studyResults.id })
          .returning({
            id: schema.studyResults.id,
            flashcardId: schema.studyResults.flashcardId,
            assessment: schema.studyResults.assessment,
            createdAt: schema.studyResults.createdAt,
          });

        if (!created) {
          const [existing] = await transaction
            .select({
              id: schema.studyResults.id,
              flashcardId: schema.studyResults.flashcardId,
              assessment: schema.studyResults.assessment,
              createdAt: schema.studyResults.createdAt,
            })
            .from(schema.studyResults)
            .where(eq(schema.studyResults.id, input.id));

          return existing;
        }

        await transaction
          .update(schema.flashcards)
          .set({
            recallStreak: nextRecallStreak(
              flashcard.recallStreak,
              input.assessment,
            ),
          })
          .where(eq(schema.flashcards.id, input.flashcardId));

        return created;
      });
    },
  };
}
