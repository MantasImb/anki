import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { requireReleaseConfiguration } from "../src/adapters/configuration/release";
import { verifyDeployment } from "./verify-deployment";

const configuration = requireReleaseConfiguration(process.env);
const client = postgres(configuration.databaseUrl, {
  connect_timeout: 10,
  idle_timeout: 5,
  max: 1,
});

console.log(`Applying migrations to: ${configuration.databaseIdentity}`);

try {
  await migrate(drizzle(client), { migrationsFolder: "drizzle" });
} finally {
  await client.end({ timeout: 5 });
}

await verifyDeployment();
