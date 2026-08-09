import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createGenerationService } from "../../../application/generation";
import { createDrizzleGenerationRepository } from "./generation-repository";

describe("PostgreSQL Generation persistence", () => {
  let client: PGlite;

  beforeEach(async () => {
    client = await PGlite.create();
    await migrate(drizzle(client), { migrationsFolder: "drizzle" });
  });

  afterEach(async () => {
    await client.close();
  });

  it("retains a complete pending Card Draft collection with its Source Text", async () => {
    const firstConnection = createGenerationService({
      repository: createDrizzleGenerationRepository(drizzle(client)),
      generator: {
        async generate() {
          return [
            { front: "høflig", back: "polite" },
            { front: "en drosjesjåfør", back: "a taxi driver" },
          ];
        },
      },
      maximumSourceTextCharacters: 20_000,
    });

    const completed = await firstConnection.generate(
      "Drosjesjåføren skal opptre høflig.",
    );
    const secondConnection = createDrizzleGenerationRepository(drizzle(client));

    expect(await secondConnection.getSourceWithDrafts(completed.id)).toEqual(
      completed,
    );
    expect(completed.generationStatus).toBe("completed");
    expect(completed.drafts).toMatchObject([
      { front: "høflig", back: "polite", reviewStatus: "pending" },
      {
        front: "en drosjesjåfør",
        back: "a taxi driver",
        reviewStatus: "pending",
      },
    ]);
  });

  it("retains no partial Card Drafts when the complete collection cannot be saved", async () => {
    const repository = createDrizzleGenerationRepository(drizzle(client));
    const source = await repository.createSource(
      "Drosjesjåføren skal opptre høflig.",
    );

    await expect(
      repository.completeGeneration(source.id, [
        { front: "høflig", back: "polite" },
        { front: " ", back: "a taxi driver" },
      ]),
    ).rejects.toThrow();

    expect(await repository.getSourceWithDrafts(source.id)).toEqual({
      ...source,
      drafts: [],
    });
  });
});
