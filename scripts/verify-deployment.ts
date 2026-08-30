import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { DEFAULT_GENERATION_TEMPLATE } from "../src/application/generation";
import { requireReleaseConfiguration } from "../src/adapters/configuration/release";
import {
  requireCompleteMigrationHistory,
  requireExpectedDatabaseObjects,
  requireFreshV2DatabaseState,
  type ExpectedMigration,
  expectedDatabaseObjects,
} from "../src/adapters/persistence/postgres/migration-readiness";

async function readExpectedMigrations() {
  const journalUrl = new URL("../drizzle/meta/_journal.json", import.meta.url);
  const journal = JSON.parse(await readFile(journalUrl, "utf8")) as {
    entries: ExpectedMigration[];
  };

  return journal.entries;
}

export async function verifyDeployment({
  requireFresh = false,
}: {
  requireFresh?: boolean;
} = {}) {
  const configuration = requireReleaseConfiguration(process.env);
  const client = postgres(configuration.databaseUrl, {
    connect_timeout: 10,
    idle_timeout: 5,
    max: 1,
  });

  console.log(`Verifying release database: ${configuration.databaseIdentity}`);

  try {
    const objectRows = await client<{ object_name: string }[]>`
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
    `;
    requireExpectedDatabaseObjects(
      expectedDatabaseObjects,
      objectRows.map(({ object_name }) => object_name),
    );

    const migrationRows = await client<{ created_at: string }[]>`
      select created_at::text as created_at
      from drizzle.__drizzle_migrations
      order by created_at
    `;
    requireCompleteMigrationHistory(
      await readExpectedMigrations(),
      migrationRows.map(({ created_at }) => created_at),
    );

    if (requireFresh) {
      const [rowCounts] = await client<
        Array<{
          answer_options: number;
          card_drafts: number;
          flashcard_decks: number;
          flashcards: number;
          generation_instructions: number;
          question_image_cleanup: number;
          question_image_uploads: number;
          quizzes: number;
          quiz_questions: number;
          quiz_results: number;
          source_texts: number;
          study_results: number;
        }>
      >`
        select
          (select count(*)::int from answer_options) as answer_options,
          (select count(*)::int from card_drafts) as card_drafts,
          (select count(*)::int from flashcard_decks) as flashcard_decks,
          (select count(*)::int from flashcards) as flashcards,
          (select count(*)::int from generation_instructions) as generation_instructions,
          (select count(*)::int from question_image_cleanup) as question_image_cleanup,
          (select count(*)::int from question_image_uploads) as question_image_uploads,
          (select count(*)::int from quizzes) as quizzes,
          (select count(*)::int from quiz_questions) as quiz_questions,
          (select count(*)::int from quiz_results) as quiz_results,
          (select count(*)::int from source_texts) as source_texts,
          (select count(*)::int from study_results) as study_results
      `;
      const [storedInstructions] = await client<{ instructions: string }[]>`
        select instructions
        from generation_instructions
        where id = 'generation-instructions'
      `;
      requireFreshV2DatabaseState({
        effectiveGenerationInstructions:
          storedInstructions?.instructions ?? DEFAULT_GENERATION_TEMPLATE,
        rowCounts,
      });
    }
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.startsWith("Database migration history is incomplete.") ||
        error.message.startsWith("Database schema is incomplete."))
    ) {
      throw error;
    }

    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : undefined;
    throw new Error(
      `Deployment database check failed${code ? ` (code ${code})` : ""}.`,
    );
  } finally {
    await client.end({ timeout: 5 });
  }

  console.log(
    requireFresh
      ? "Deployment configuration, v2 schema, and fresh database state are ready."
      : "Deployment configuration and v2 database schema are ready.",
  );
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  await verifyDeployment();
}
