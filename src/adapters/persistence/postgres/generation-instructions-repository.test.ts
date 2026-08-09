import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDrizzleGenerationInstructionsRepository } from "./generation-instructions-repository";

describe("PostgreSQL Generation Instructions persistence", () => {
  let client: PGlite;

  beforeEach(async () => {
    client = await PGlite.create();
    await migrate(drizzle(client), { migrationsFolder: "drizzle" });
  });

  afterEach(async () => {
    await client.close();
  });

  it("makes saved instructions available through another connection", async () => {
    const firstConnection = createDrizzleGenerationInstructionsRepository(
      drizzle(client),
    );
    await firstConnection.save("Prefer short, practical phrases.");

    const secondConnection = createDrizzleGenerationInstructionsRepository(
      drizzle(client),
    );

    expect(await secondConnection.get()).toBe(
      "Prefer short, practical phrases.",
    );
  });
});
