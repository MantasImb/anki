import postgres from "postgres";
import { validateDeploymentConfiguration } from "../src/adapters/configuration/deployment";

const expectedTables = [
  "card_drafts",
  "flashcards",
  "generation_instructions",
  "source_texts",
  "study_results",
] as const;

async function verifyDeployment() {
  const configuration = validateDeploymentConfiguration(process.env);
  const client = postgres(configuration.databaseUrl, {
    connect_timeout: 10,
    idle_timeout: 5,
    max: 1,
  });

  try {
    const rows = await client<{ table_name: string }[]>`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in ${client(expectedTables)}
    `;
    const present = new Set(rows.map(({ table_name }) => table_name));
    const missing = expectedTables.filter((table) => !present.has(table));

    if (missing.length > 0) {
      throw new Error(
        `Database migration history is incomplete. Missing tables: ${missing.join(", ")}.`,
      );
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Database migration history is incomplete.")
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

await verifyDeployment();
