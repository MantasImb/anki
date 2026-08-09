import { and, asc, eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type {
  CardDraftReviewRepository,
  DraftApproval,
} from "../../../application/draft-review";
import type { NewFlashcard } from "../../../application/flashcards";
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
      sourceTextId: string,
      id: string,
      input: NewFlashcard,
    ): Promise<CardDraft | undefined> {
      if (!isUuid(sourceTextId) || !isUuid(id)) {
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
          ),
        )
        .returning(draftSelection);

      return updated;
    },

    approve(
      sourceTextId: string,
      id: string,
      input: NewFlashcard,
    ): Promise<DraftApproval | undefined> {
      if (!isUuid(sourceTextId) || !isUuid(id)) {
        return Promise.resolve(undefined);
      }

      return database.transaction(async (transaction) => {
        const [draft] = await transaction
          .select(draftSelection)
          .from(schema.cardDrafts)
          .where(
            and(
              eq(schema.cardDrafts.id, id),
              eq(schema.cardDrafts.sourceTextId, sourceTextId),
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
            .where(eq(schema.flashcards.id, draft.approvedFlashcardId));

          return flashcard ? { draft, flashcard } : undefined;
        }

        const [flashcard] = await transaction
          .insert(schema.flashcards)
          .values({ ...input, sourceTextId: draft.sourceTextId })
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

    approveRemaining(sourceTextId: string): Promise<DraftApproval[]> {
      if (!isUuid(sourceTextId)) {
        return Promise.resolve([]);
      }

      return database.transaction(async (transaction) => {
        const drafts = await transaction
          .select(draftSelection)
          .from(schema.cardDrafts)
          .where(
            and(
              eq(schema.cardDrafts.sourceTextId, sourceTextId),
              eq(schema.cardDrafts.reviewStatus, "pending"),
            ),
          )
          .orderBy(asc(schema.cardDrafts.position))
          .for("update");
        const approvals: DraftApproval[] = [];

        for (const draft of drafts) {
          const [flashcard] = await transaction
            .insert(schema.flashcards)
            .values({
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
      sourceTextId: string,
      id: string,
    ): Promise<CardDraft | undefined> {
      if (!isUuid(sourceTextId) || !isUuid(id)) {
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
          ),
        );

      return alreadyRejected;
    },
  };
}
