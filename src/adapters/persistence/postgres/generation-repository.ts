import { and, asc, eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type {
  GeneratedCardDraft,
  GenerationRepository,
  SourceText,
  SourceWithDrafts,
} from "../../../application/generation";
import * as schema from "./schema";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function createDrizzleGenerationRepository<
  TResult extends PgQueryResultHKT,
>(database: PgDatabase<TResult, typeof schema>): GenerationRepository {
  return {
    async createSource(deckId: string, content: string): Promise<SourceText> {
      const [created] = await database
        .insert(schema.sourceTexts)
        .values({ deckId, content })
        .returning({
          id: schema.sourceTexts.id,
          deckId: schema.sourceTexts.deckId,
          content: schema.sourceTexts.content,
          generationStatus: schema.sourceTexts.generationStatus,
        });

      return created;
    },

    async claimFailedSource(
      deckId: string,
      sourceTextId: string,
    ): Promise<SourceText | undefined> {
      if (!isUuid(sourceTextId)) {
        return undefined;
      }

      const [claimed] = await database
        .update(schema.sourceTexts)
        .set({ generationStatus: "ready" })
        .where(
          and(
            eq(schema.sourceTexts.id, sourceTextId),
            eq(schema.sourceTexts.deckId, deckId),
            eq(schema.sourceTexts.generationStatus, "failed"),
          ),
        )
        .returning({
          id: schema.sourceTexts.id,
          deckId: schema.sourceTexts.deckId,
          content: schema.sourceTexts.content,
          generationStatus: schema.sourceTexts.generationStatus,
        });

      return claimed;
    },

    async failGeneration(
      deckId: string,
      sourceTextId: string,
    ): Promise<SourceWithDrafts> {
      const [failed] = await database
        .update(schema.sourceTexts)
        .set({ generationStatus: "failed" })
        .where(
          and(
            eq(schema.sourceTexts.id, sourceTextId),
            eq(schema.sourceTexts.deckId, deckId),
            eq(schema.sourceTexts.generationStatus, "ready"),
          ),
        )
        .returning({
          id: schema.sourceTexts.id,
          deckId: schema.sourceTexts.deckId,
          content: schema.sourceTexts.content,
          generationStatus: schema.sourceTexts.generationStatus,
        });
      if (!failed) throw new Error("Source Text was not found.");
      return { ...failed, drafts: [] };
    },

    completeGeneration(
      deckId: string,
      sourceTextId: string,
      drafts: GeneratedCardDraft[],
    ): Promise<SourceWithDrafts> {
      return database.transaction(async (transaction) => {
        const [completed] = await transaction
          .update(schema.sourceTexts)
          .set({ generationStatus: "completed" })
          .where(
            and(
              eq(schema.sourceTexts.id, sourceTextId),
              eq(schema.sourceTexts.deckId, deckId),
              eq(schema.sourceTexts.generationStatus, "ready"),
            ),
          )
          .returning({
            id: schema.sourceTexts.id,
            deckId: schema.sourceTexts.deckId,
            content: schema.sourceTexts.content,
            generationStatus: schema.sourceTexts.generationStatus,
          });
        if (!completed) throw new Error("Source Text was not found.");

        const createdDrafts = await transaction
          .insert(schema.cardDrafts)
          .values(
            drafts.map((draft, position) => ({
              ...draft,
              position,
              sourceTextId,
            })),
          )
          .returning({
            id: schema.cardDrafts.id,
            sourceTextId: schema.cardDrafts.sourceTextId,
            front: schema.cardDrafts.front,
            back: schema.cardDrafts.back,
            reviewStatus: schema.cardDrafts.reviewStatus,
            approvedFlashcardId: schema.cardDrafts.approvedFlashcardId,
          });
        return { ...completed, drafts: createdDrafts };
      });
    },

    async getSourceWithDrafts(
      deckId: string,
      id: string,
    ): Promise<SourceWithDrafts | undefined> {
      if (!isUuid(id)) {
        return undefined;
      }

      const [source] = await database
        .select({
          id: schema.sourceTexts.id,
          deckId: schema.sourceTexts.deckId,
          content: schema.sourceTexts.content,
          generationStatus: schema.sourceTexts.generationStatus,
        })
        .from(schema.sourceTexts)
        .where(
          and(
            eq(schema.sourceTexts.id, id),
            eq(schema.sourceTexts.deckId, deckId),
          ),
        );

      if (!source) {
        return undefined;
      }

      const drafts = await database
        .select({
          id: schema.cardDrafts.id,
          sourceTextId: schema.cardDrafts.sourceTextId,
          front: schema.cardDrafts.front,
          back: schema.cardDrafts.back,
          reviewStatus: schema.cardDrafts.reviewStatus,
          approvedFlashcardId: schema.cardDrafts.approvedFlashcardId,
        })
        .from(schema.cardDrafts)
        .where(eq(schema.cardDrafts.sourceTextId, id))
        .orderBy(asc(schema.cardDrafts.position));

      return { ...source, drafts };
    },
  };
}
