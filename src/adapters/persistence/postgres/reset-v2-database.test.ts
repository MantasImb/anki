import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterEach, describe, expect, it } from "vitest";
import { resetV2Database } from "./reset-v2-database";

describe("v2 database reset", () => {
  let client: PGlite | undefined;

  afterEach(async () => {
    await client?.close();
  });

  it(
    "removes learner state and migration history so the complete schema can be reapplied",
    async () => {
      client = await PGlite.create();
      await migrate(drizzle(client), { migrationsFolder: "drizzle" });
      await client.exec(`
        insert into flashcard_decks (name, name_key)
        values ('Old v1 content', 'old v1 content')
      `);

      await client.transaction(async (transaction) => {
        await resetV2Database({
          execute: async (statement) => {
            await transaction.exec(statement);
          },
        });
      });
      await migrate(drizzle(client), { migrationsFolder: "drizzle" });

      const decks = await client.query<{ count: number }>(
        "select count(*)::int as count from flashcard_decks",
      );
      const migrations = await client.query<{ count: number }>(
        "select count(*)::int as count from drizzle.__drizzle_migrations",
      );
      expect(decks.rows[0].count).toBe(0);
      expect(migrations.rows[0].count).toBeGreaterThan(0);
    },
    20_000,
  );
});
