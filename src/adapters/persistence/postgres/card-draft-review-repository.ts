import { and, asc, eq, inArray } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type {
  CardDraftReviewRepository,
  DraftApproval,
} from "../../../application/draft-review";
import type { FlashcardContent } from "../../../application/flashcards";
import type { CardDraft } from "../../../application/generation";
import * as schema from "./schema";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

const draftSelection = {
  id: schema.cardDrafts.id,
  sourceTextId: schema.cardDrafts.sourceTextId,
  front: schema.cardDrafts.front,
  back: schema.cardDrafts.back,
  reviewStatus: schema.cardDrafts.reviewStatus,
  approvedFlashcardId: schema.cardDrafts.approvedFlashcardId,
};

const flashcardSelection = {
  id: schema.flashcards.id,
  deckId: schema.flashcards.deckId,
  sourceTextId: schema.flashcards.sourceTextId,
  front: schema.flashcards.front,
  back: schema.flashcards.back,
  recallStreak: schema.flashcards.recallStreak,
};

export function createDrizzleCardDraftReviewRepository<
  TResult extends PgQueryResultHKT,
>(
  database: PgDatabase<TResult, typeof schema>,
): CardDraftReviewRepository {
  return {
    async updatePending(
      deckId: string,
      sourceTextId: string,
      id: string,
      input: FlashcardContent,
    ): Promise<CardDraft | undefined> {
      if (!isUuid(deckId) || !isUuid(sourceTextId) || !isUuid(id)) {
        return undefined;
      }

      const [updated] = await database
        .update(schema.cardDrafts)
        .set(input)
        .where(
          and(
            eq(schema.cardDrafts.id, id),
            eq(schema.cardDrafts.sourceTextId, sourceTextId),
            eq(schema.cardDrafts.reviewStatus, "pending"),
            inArray(
              schema.cardDrafts.sourceTextId,
              database
                .select({ id: schema.sourceTexts.id })
                .from(schema.sourceTexts)
                .where(eq(schema.sourceTexts.deckId, deckId)),
            ),
          ),
        )
        .returning(draftSelection);

      return updated;
    },

    approve(
      deckId: string,
      sourceTextId: string,
      id: string,
      input: FlashcardContent,
    ): Promise<DraftApproval | undefined> {
      if (!isUuid(deckId) || !isUuid(sourceTextId) || !isUuid(id)) {
        return Promise.resolve(undefined);
      }

      return database.transaction(async (transaction) => {
        const [draft] = await transaction
          .select(draftSelection)
          .from(schema.cardDrafts)
          .innerJoin(
            schema.sourceTexts,
            eq(schema.sourceTexts.id, schema.cardDrafts.sourceTextId),
          )
          .where(
            and(
              eq(schema.cardDrafts.id, id),
              eq(schema.cardDrafts.sourceTextId, sourceTextId),
              eq(schema.sourceTexts.deckId, deckId),
            ),
          )
          .for("update");

        if (!draft || draft.reviewStatus === "rejected") {
          return undefined;
        }

        if (draft.reviewStatus === "approved") {
          if (!draft.approvedFlashcardId) {
            return undefined;
          }

          const [flashcard] = await transaction
            .select(flashcardSelection)
            .from(schema.flashcards)
            .where(
              and(
                eq(schema.flashcards.id, draft.approvedFlashcardId),
                eq(schema.flashcards.deckId, deckId),
              ),
            );

          return flashcard ? { draft, flashcard } : undefined;
        }

        const [flashcard] = await transaction
          .insert(schema.flashcards)
          .values({ deckId, ...input, sourceTextId: draft.sourceTextId })
          .returning(flashcardSelection);

        const [approvedDraft] = await transaction
          .update(schema.cardDrafts)
          .set({
            ...input,
            reviewStatus: "approved",
            approvedFlashcardId: flashcard.id,
          })
          .where(eq(schema.cardDrafts.id, draft.id))
          .returning(draftSelection);

        return { draft: approvedDraft, flashcard };
      });
    },

    approveRemaining(
      deckId: string,
      sourceTextId: string,
    ): Promise<DraftApproval[]> {
      if (!isUuid(deckId) || !isUuid(sourceTextId)) {
        return Promise.resolve([]);
      }

      return database.transaction(async (transaction) => {
        const drafts = await transaction
          .select(draftSelection)
          .from(schema.cardDrafts)
          .innerJoin(
            schema.sourceTexts,
            eq(schema.sourceTexts.id, schema.cardDrafts.sourceTextId),
          )
          .where(
            and(
              eq(schema.cardDrafts.sourceTextId, sourceTextId),
              eq(schema.cardDrafts.reviewStatus, "pending"),
              eq(schema.sourceTexts.deckId, deckId),
            ),
          )
          .orderBy(asc(schema.cardDrafts.position))
          .for("update");
        const approvals: DraftApproval[] = [];

        for (const draft of drafts) {
          const [flashcard] = await transaction
            .insert(schema.flashcards)
            .values({
              deckId,
              front: draft.front,
              back: draft.back,
              sourceTextId: draft.sourceTextId,
            })
            .returning(flashcardSelection);
          const [approvedDraft] = await transaction
            .update(schema.cardDrafts)
            .set({
              reviewStatus: "approved",
              approvedFlashcardId: flashcard.id,
            })
            .where(eq(schema.cardDrafts.id, draft.id))
            .returning(draftSelection);

          approvals.push({ draft: approvedDraft, flashcard });
        }

        return approvals;
      });
    },

    async reject(
      deckId: string,
      sourceTextId: string,
      id: string,
    ): Promise<CardDraft | undefined> {
      if (!isUuid(deckId) || !isUuid(sourceTextId) || !isUuid(id)) {
        return undefined;
      }

      const [rejected] = await database
        .update(schema.cardDrafts)
        .set({ reviewStatus: "rejected" })
        .where(
          and(
            eq(schema.cardDrafts.id, id),
            eq(schema.cardDrafts.sourceTextId, sourceTextId),
            eq(schema.cardDrafts.reviewStatus, "pending"),
            inArray(
              schema.cardDrafts.sourceTextId,
              database
                .select({ id: schema.sourceTexts.id })
                .from(schema.sourceTexts)
                .where(eq(schema.sourceTexts.deckId, deckId)),
            ),
          ),
        )
        .returning(draftSelection);

      if (rejected) {
        return rejected;
      }

      const [alreadyRejected] = await database
        .select(draftSelection)
        .from(schema.cardDrafts)
        .where(
          and(
            eq(schema.cardDrafts.id, id),
            eq(schema.cardDrafts.sourceTextId, sourceTextId),
            eq(schema.cardDrafts.reviewStatus, "rejected"),
            inArray(
              schema.cardDrafts.sourceTextId,
              database
                .select({ id: schema.sourceTexts.id })
                .from(schema.sourceTexts)
                .where(eq(schema.sourceTexts.deckId, deckId)),
            ),
          ),
        );

      return alreadyRejected;
    },
  };
}
