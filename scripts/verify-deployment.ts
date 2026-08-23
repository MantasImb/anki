import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { requireReleaseConfiguration } from "../src/adapters/configuration/release";
import {
  requireCompleteMigrationHistory,
  requireExpectedDatabaseObjects,
  type ExpectedMigration,
  v1ExpectedDatabaseObjects,
} from "../src/adapters/persistence/postgres/migration-readiness";

async function readExpectedMigrations() {
  const journalUrl = new URL("../drizzle/meta/_journal.json", import.meta.url);
  const journal = JSON.parse(await readFile(journalUrl, "utf8")) as {
    entries: ExpectedMigration[];
  };

  return journal.entries;
}

export async function verifyDeployment() {
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
      v1ExpectedDatabaseObjects,
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

  console.log("Deployment configuration and v1 database schema are ready.");
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  await verifyDeployment();
}
