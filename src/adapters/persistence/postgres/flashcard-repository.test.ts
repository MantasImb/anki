import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createCollectionService } from "../../../application/collections";
import { createFlashcardService } from "../../../application/flashcards";
import { createDrizzleFlashcardDeckRepository } from "./collection-repository";
import { createDrizzleFlashcardRepository } from "./flashcard-repository";

describe("PostgreSQL Flashcard persistence", () => {
  let client: PGlite;
  let deckId: string;

  beforeEach(async () => {
    client = await PGlite.create();
    await migrate(drizzle(client), { migrationsFolder: "drizzle" });
    deckId = (
      await createCollectionService(
        "Flashcard Deck",
        createDrizzleFlashcardDeckRepository(drizzle(client)),
      ).create({ name: "Default test Deck" })
    ).id;
  });

  afterEach(async () => {
    await client.close();
  });

  it("persists required Deck ownership and scopes Flashcard queries", async () => {
    const database = drizzle(client);
    const decks = createCollectionService(
      "Flashcard Deck",
      createDrizzleFlashcardDeckRepository(database),
    );
    const firstDeck = await decks.create({ name: "På vei" });
    const secondDeck = await decks.create({ name: "Norsk nå" });
    const flashcards = createFlashcardService(
      createDrizzleFlashcardRepository(database),
    );
    const selected = await flashcards.create({
      deckId: firstDeck.id,
      front: "høflig",
      back: "polite",
    });
    await flashcards.create({
      deckId: secondDeck.id,
      front: "ledig",
      back: "available",
    });

    expect(await flashcards.list(firstDeck.id)).toEqual([selected]);
  });

  it("keeps a created Flashcard available to a new repository instance", async () => {
    const firstConnection = createFlashcardService(
      createDrizzleFlashcardRepository(drizzle(client)),
    );
    const created = await firstConnection.create({
      deckId,
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
    });

    const secondConnection = createFlashcardService(
      createDrizzleFlashcardRepository(drizzle(client)),
    );

    expect(await secondConnection.list(deckId)).toEqual([created]);
  });

  it("keeps an edited Flashcard available to a new repository instance", async () => {
    const firstConnection = createFlashcardService(
      createDrizzleFlashcardRepository(drizzle(client)),
    );
    const created = await firstConnection.create({
      deckId,
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
    });

    const updated = await firstConnection.update(deckId, created.id, {
      front: "Jeg kjører taxi.",
      back: "I drive a cab.",
    });
    const secondConnection = createFlashcardService(
      createDrizzleFlashcardRepository(drizzle(client)),
    );

    expect(await secondConnection.list(deckId)).toEqual([updated]);
  });

  it("keeps a deleted Flashcard absent for a new repository instance", async () => {
    const firstConnection = createFlashcardService(
      createDrizzleFlashcardRepository(drizzle(client)),
    );
    const created = await firstConnection.create({
      deckId,
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
    });

    await firstConnection.delete(deckId, created.id);
    const secondConnection = createFlashcardService(
      createDrizzleFlashcardRepository(drizzle(client)),
    );

    expect(await secondConnection.list(deckId)).toEqual([]);
  });

  it("treats an invalid Flashcard identifier as missing", async () => {
    const flashcards = createFlashcardService(
      createDrizzleFlashcardRepository(drizzle(client)),
    );

    expect(await flashcards.get(deckId, "not-a-card-id")).toBeUndefined();
  });

  it("prevents a blank Front from being persisted", async () => {
    const repository = createDrizzleFlashcardRepository(drizzle(client));

    await expect(
      repository.create({ deckId, front: "\t", back: "I drive a taxi." }),
    ).rejects.toThrow();
    expect(await repository.list(deckId)).toEqual([]);
  });

  it("prevents a blank Back from being persisted", async () => {
    const repository = createDrizzleFlashcardRepository(drizzle(client));

    await expect(
      repository.create({ deckId, front: "Jeg kjører drosje.", back: "\t" }),
    ).rejects.toThrow();
    expect(await repository.list(deckId)).toEqual([]);
  });
});
