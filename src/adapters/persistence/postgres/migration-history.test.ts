import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterEach, describe, expect, it } from "vitest";
import {
  requireExpectedDatabaseObjects,
  v1ExpectedDatabaseObjects,
} from "./migration-readiness";

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

      const databaseObjects = await client.query<{ object_name: string }>(`
        select 'base table: ' || table_name as object_name
        from information_schema.tables
        where table_schema = 'public' and table_type = 'BASE TABLE'
        union all
        select 'column: ' || table_name || '.' || column_name as object_name
        from information_schema.columns
        where table_schema = 'public'
        union all
        select 'constraint: ' || constraint_name as object_name
        from information_schema.table_constraints
        where table_schema = 'public'
      `);
      expect(() =>
        requireExpectedDatabaseObjects(
          v1ExpectedDatabaseObjects,
          databaseObjects.rows.map(({ object_name }) => object_name),
        ),
      ).not.toThrow();
    },
    15_000,
  );
});
