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
    async createSource(content: string): Promise<SourceText> {
      const [created] = await database
        .insert(schema.sourceTexts)
        .values({ content })
        .returning({
          id: schema.sourceTexts.id,
          content: schema.sourceTexts.content,
          generationStatus: schema.sourceTexts.generationStatus,
        });

      return created;
    },

    async claimFailedSource(
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
            eq(schema.sourceTexts.generationStatus, "failed"),
          ),
        )
        .returning({
          id: schema.sourceTexts.id,
          content: schema.sourceTexts.content,
          generationStatus: schema.sourceTexts.generationStatus,
        });

      return claimed;
    },

    async failGeneration(sourceTextId: string): Promise<SourceWithDrafts> {
      const [failed] = await database
        .update(schema.sourceTexts)
        .set({ generationStatus: "failed" })
        .where(eq(schema.sourceTexts.id, sourceTextId))
        .returning({
          id: schema.sourceTexts.id,
          content: schema.sourceTexts.content,
          generationStatus: schema.sourceTexts.generationStatus,
        });

      return { ...failed, drafts: [] };
    },

    completeGeneration(
      sourceTextId: string,
      drafts: GeneratedCardDraft[],
    ): Promise<SourceWithDrafts> {
      return database.transaction(async (transaction) => {
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

        const [completed] = await transaction
          .update(schema.sourceTexts)
          .set({ generationStatus: "completed" })
          .where(eq(schema.sourceTexts.id, sourceTextId))
          .returning({
            id: schema.sourceTexts.id,
            content: schema.sourceTexts.content,
            generationStatus: schema.sourceTexts.generationStatus,
          });

        return { ...completed, drafts: createdDrafts };
      });
    },

    async getSourceWithDrafts(
      id: string,
    ): Promise<SourceWithDrafts | undefined> {
      if (!isUuid(id)) {
        return undefined;
      }

      const [source] = await database
        .select({
          id: schema.sourceTexts.id,
          content: schema.sourceTexts.content,
          generationStatus: schema.sourceTexts.generationStatus,
        })
        .from(schema.sourceTexts)
        .where(eq(schema.sourceTexts.id, id));

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
