import { eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type { GenerationInstructionsRepository } from "../../../application/generation-instructions";
import * as schema from "./schema";

const SINGLETON_ID = "generation-instructions";

export function createDrizzleGenerationInstructionsRepository<
  TResult extends PgQueryResultHKT,
>(
  database: PgDatabase<TResult, typeof schema>,
): GenerationInstructionsRepository {
  return {
    async get() {
      const [stored] = await database
        .select({ instructions: schema.generationInstructions.instructions })
        .from(schema.generationInstructions)
        .where(eq(schema.generationInstructions.id, SINGLETON_ID));

      return stored?.instructions;
    },
    async save(instructions) {
      const [stored] = await database
        .insert(schema.generationInstructions)
        .values({ id: SINGLETON_ID, instructions })
        .onConflictDoUpdate({
          target: schema.generationInstructions.id,
          set: { instructions, updatedAt: new Date() },
        })
        .returning({ instructions: schema.generationInstructions.instructions });

      return stored.instructions;
    },
  };
}
