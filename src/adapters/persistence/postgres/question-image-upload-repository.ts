import { asc, eq, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type {
  QuestionImageUpload,
  QuestionImageUploadRepository,
} from "../../../application/question-images";
import * as schema from "./schema";

const uploadSelection = {
  id: schema.questionImageUploads.id,
  objectKey: schema.questionImageUploads.objectKey,
  originalName: schema.questionImageUploads.originalName,
  contentType: schema.questionImageUploads.contentType,
  byteSize: schema.questionImageUploads.byteSize,
  status: schema.questionImageUploads.status,
};

export function createDrizzleQuestionImageUploadRepository<
  TResult extends PgQueryResultHKT,
>(
  database: PgDatabase<TResult, typeof schema>,
): QuestionImageUploadRepository {
  return {
    async create(upload) {
      await database.insert(schema.questionImageUploads).values(upload);
    },
    async get(id) {
      const [upload] = await database
        .select(uploadSelection)
        .from(schema.questionImageUploads)
        .where(eq(schema.questionImageUploads.id, id));
      return upload as QuestionImageUpload | undefined;
    },
    async markCompleted(id) {
      const [upload] = await database
        .update(schema.questionImageUploads)
        .set({ status: "completed" })
        .where(
          sql`${schema.questionImageUploads.id} = ${id} and ${schema.questionImageUploads.status} = 'pending'`,
        )
        .returning(uploadSelection);
      return upload as QuestionImageUpload | undefined;
    },
    async listCleanup(limit = 20) {
      const rows = await database
        .select({ objectKey: schema.questionImageCleanup.objectKey })
        .from(schema.questionImageCleanup)
        .orderBy(asc(schema.questionImageCleanup.createdAt))
        .limit(limit);
      return rows.map(({ objectKey }) => objectKey);
    },
    async completeCleanup(objectKey) {
      await database
        .delete(schema.questionImageCleanup)
        .where(eq(schema.questionImageCleanup.objectKey, objectKey));
    },
    async recordCleanupFailure(objectKey, message) {
      await database
        .update(schema.questionImageCleanup)
        .set({
          attempts: sql`${schema.questionImageCleanup.attempts} + 1`,
          lastError: message.slice(0, 1000),
        })
        .where(eq(schema.questionImageCleanup.objectKey, objectKey));
    },
  };
}
