import { asc, eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { FlashcardNotFoundError, type Flashcard } from "../../../application/flashcards";
import {
  nextRecallStreak,
  type RecordStudyResult,
  type RecordedStudyResult,
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

export function createDrizzleStudyRepository<
  TResult extends PgQueryResultHKT,
>(database: PgDatabase<TResult, typeof schema>): StudyRepository {
  return {
    cards(): Promise<Flashcard[]> {
      return database
        .select(selectedFlashcard)
        .from(schema.flashcards)
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

    recordResult(input: RecordStudyResult): Promise<RecordedStudyResult> {
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
