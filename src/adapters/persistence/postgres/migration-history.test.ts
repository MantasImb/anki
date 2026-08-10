import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterEach, describe, expect, it } from "vitest";

describe("complete PostgreSQL migration history", () => {
  let client: PGlite | undefined;

  afterEach(async () => {
    await client?.close();
  });

  it(
    "creates the complete v1 schema on a clean database",
    async () => {
      client = await PGlite.create();

      await migrate(drizzle(client), { migrationsFolder: "drizzle" });

      const relations = await client.query<{ tablename: string }>(`
      select tablename
      from pg_tables
      where schemaname = 'public'
        and tablename in (
          'card_drafts',
          'flashcards',
          'generation_instructions',
          'source_texts',
          'study_results'
        )
      order by tablename
    `);
      expect(relations.rows.map(({ tablename }) => tablename)).toEqual([
        "card_drafts",
        "flashcards",
        "generation_instructions",
        "source_texts",
        "study_results",
      ]);
    },
    15_000,
  );
});
