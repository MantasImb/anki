import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { requireReleaseCutoverConfiguration } from "../src/adapters/configuration/release";
import { resetV2Database } from "../src/adapters/persistence/postgres/reset-v2-database";
import { verifyDeployment } from "./verify-deployment";

const configuration = requireReleaseCutoverConfiguration(process.env);
const client = postgres(configuration.databaseUrl, {
  connect_timeout: 10,
  idle_timeout: 5,
  max: 1,
});

console.log(`Resetting confirmed release database: ${configuration.databaseIdentity}`);

try {
  await client.begin(async (transaction) => {
    await resetV2Database({
      execute: async (statement) => {
        await transaction.unsafe(statement);
      },
    });
  });
  await migrate(drizzle(client), { migrationsFolder: "drizzle" });
} finally {
  await client.end({ timeout: 5 });
}

await verifyDeployment({ requireFresh: true });
