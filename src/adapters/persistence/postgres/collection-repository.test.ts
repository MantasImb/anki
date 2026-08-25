import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createCollectionService } from "../../../application/collections";
import {
  createDrizzleFlashcardDeckRepository,
  createDrizzleQuizRepository,
} from "./collection-repository";

describe("PostgreSQL collection persistence", () => {
  let client: PGlite;

  beforeEach(async () => {
    client = await PGlite.create();
    await migrate(drizzle(client), { migrationsFolder: "drizzle" });
  });

  afterEach(async () => {
    await client.close();
  });

  it("creates no default collections in a fresh database", async () => {
    const decks = createCollectionService(
      "Flashcard Deck",
      createDrizzleFlashcardDeckRepository(drizzle(client)),
    );
    const quizzes = createCollectionService(
      "Quiz",
      createDrizzleQuizRepository(drizzle(client)),
    );

    expect(await decks.list()).toEqual([]);
    expect(await quizzes.list()).toEqual([]);
  });

  it("retains a Flashcard Deck for a new repository instance", async () => {
    const firstConnection = createCollectionService(
      "Flashcard Deck",
      createDrizzleFlashcardDeckRepository(drizzle(client)),
    );
    const created = await firstConnection.create({ name: "På vei" });

    const secondConnection = createCollectionService(
      "Flashcard Deck",
      createDrizzleFlashcardDeckRepository(drizzle(client)),
    );

    expect(await secondConnection.list()).toEqual([created]);
    expect(await secondConnection.get(created.id)).toEqual(created);
  });

  it("enforces independent Deck and Quiz name constraints", async () => {
    const decks = createCollectionService(
      "Flashcard Deck",
      createDrizzleFlashcardDeckRepository(drizzle(client)),
    );
    const quizzes = createCollectionService(
      "Quiz",
      createDrizzleQuizRepository(drizzle(client)),
    );

    await decks.create({ name: "På vei" });
    const quiz = await quizzes.create({ name: "  PÅ   VEI " });

    await expect(quizzes.create({ name: "på vei" })).rejects.toMatchObject({
      name: "CollectionNameConflictError",
    });
    expect(await quizzes.list()).toEqual([quiz]);
  });

  it("prevents a blank collection name from being persisted directly", async () => {
    const repository = createDrizzleFlashcardDeckRepository(drizzle(client));

    await expect(
      repository.create({
        id: crypto.randomUUID(),
        name: " \n ",
        nameKey: "",
      }),
    ).rejects.toThrow();
    expect(await repository.list()).toEqual([]);
  });
});
