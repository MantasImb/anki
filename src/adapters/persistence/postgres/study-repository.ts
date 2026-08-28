import { and, asc, eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { FlashcardNotFoundError, type Flashcard } from "../../../application/flashcards";
import {
  nextRecallStreak,
  type RecordDeckStudyResult,
  type RecordedStudyResult,
  type StudyRepository,
  type StudyResult,
} from "../../../application/study";
import * as schema from "./schema";

const selectedFlashcard = {
  id: schema.flashcards.id,
  deckId: schema.flashcards.deckId,
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
    cards(deckId: string): Promise<Flashcard[]> {
      if (!isUuid(deckId)) {
        return Promise.resolve([]);
      }

      return database
        .select(selectedFlashcard)
        .from(schema.flashcards)
        .where(eq(schema.flashcards.deckId, deckId))
        .orderBy(asc(schema.flashcards.createdAt), asc(schema.flashcards.id));
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

    recordResult(input: RecordDeckStudyResult): Promise<RecordedStudyResult> {
      if (!isUuid(input.deckId) || !isUuid(input.flashcardId)) {
        return Promise.reject(new FlashcardNotFoundError());
      }

      return database.transaction(async (transaction) => {
        const { deckId, ...resultInput } = input;
        const [flashcard] = await transaction
          .select({ recallStreak: schema.flashcards.recallStreak })
          .from(schema.flashcards)
          .where(
            and(
              eq(schema.flashcards.deckId, deckId),
              eq(schema.flashcards.id, input.flashcardId),
            ),
          )
          .for("update");

        if (!flashcard) {
          throw new FlashcardNotFoundError();
        }

        const [created] = await transaction
          .insert(schema.studyResults)
          .values(resultInput)
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

          return { ...existing, recallStreak: flashcard.recallStreak };
        }

        const recallStreak = nextRecallStreak(
          flashcard.recallStreak,
          input.assessment,
        );

        await transaction
          .update(schema.flashcards)
          .set({ recallStreak })
          .where(eq(schema.flashcards.id, input.flashcardId));

        return { ...created, recallStreak };
      });
    },
  };
}
