import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFlashcardService } from "../../../application/flashcards";
import { createDrizzleFlashcardRepository } from "./flashcard-repository";

describe("PostgreSQL Flashcard persistence", () => {
  let client: PGlite;

  beforeEach(async () => {
    client = await PGlite.create();
    await migrate(drizzle(client), { migrationsFolder: "drizzle" });
  });

  afterEach(async () => {
    await client.close();
  });

  it("keeps a created Flashcard available to a new repository instance", async () => {
    const firstConnection = createFlashcardService(
      createDrizzleFlashcardRepository(drizzle(client)),
    );
    const created = await firstConnection.create({
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
    });

    const secondConnection = createFlashcardService(
      createDrizzleFlashcardRepository(drizzle(client)),
    );

    expect(await secondConnection.list()).toEqual([created]);
  });

  it("keeps an edited Flashcard available to a new repository instance", async () => {
    const firstConnection = createFlashcardService(
      createDrizzleFlashcardRepository(drizzle(client)),
    );
    const created = await firstConnection.create({
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
    });

    const updated = await firstConnection.update(created.id, {
      front: "Jeg kjører taxi.",
      back: "I drive a cab.",
    });
    const secondConnection = createFlashcardService(
      createDrizzleFlashcardRepository(drizzle(client)),
    );

    expect(await secondConnection.list()).toEqual([updated]);
  });

  it("keeps a deleted Flashcard absent for a new repository instance", async () => {
    const firstConnection = createFlashcardService(
      createDrizzleFlashcardRepository(drizzle(client)),
    );
    const created = await firstConnection.create({
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
    });

    await firstConnection.delete(created.id);
    const secondConnection = createFlashcardService(
      createDrizzleFlashcardRepository(drizzle(client)),
    );

    expect(await secondConnection.list()).toEqual([]);
  });

  it("treats an invalid Flashcard identifier as missing", async () => {
    const flashcards = createFlashcardService(
      createDrizzleFlashcardRepository(drizzle(client)),
    );

    expect(await flashcards.get("not-a-card-id")).toBeUndefined();
  });

  it("prevents a blank Front from being persisted", async () => {
    const repository = createDrizzleFlashcardRepository(drizzle(client));

    await expect(
      repository.create({ front: "\t", back: "I drive a taxi." }),
    ).rejects.toThrow();
    expect(await repository.list()).toEqual([]);
  });

  it("prevents a blank Back from being persisted", async () => {
    const repository = createDrizzleFlashcardRepository(drizzle(client));

    await expect(
      repository.create({ front: "Jeg kjører drosje.", back: "\t" }),
    ).rejects.toThrow();
    expect(await repository.list()).toEqual([]);
  });
});
