import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createCollectionService } from "../../../application/collections";
import { createFlashcardService } from "../../../application/flashcards";
import { createStudyService } from "../../../application/study";
import { createDrizzleFlashcardRepository } from "./flashcard-repository";
import { createDrizzleStudyRepository } from "./study-repository";
import { createDrizzleFlashcardDeckRepository } from "./collection-repository";

describe("PostgreSQL study persistence", () => {
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

  it("loads and records only Flashcards owned by the selected Deck", async () => {
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
    const other = await flashcards.create({
      deckId: secondDeck.id,
      front: "ledig",
      back: "available",
    });
    const study = createStudyService(createDrizzleStudyRepository(database));

    expect(await study.cards(firstDeck.id)).toEqual([selected]);
    await expect(
      study.recordResult({
        id: crypto.randomUUID(),
        deckId: firstDeck.id,
        flashcardId: other.id,
        assessment: "correct",
      }),
    ).rejects.toThrow("Flashcard was not found.");
  });

  it("handles a malformed Deck id through controlled repository behavior", async () => {
    const study = createStudyService(
      createDrizzleStudyRepository(drizzle(client)),
    );

    await expect(study.cards("not-a-uuid")).resolves.toEqual([]);
    await expect(
      study.recordResult({
        id: crypto.randomUUID(),
        deckId: "not-a-uuid",
        flashcardId: crypto.randomUUID(),
        assessment: "correct",
      }),
    ).rejects.toThrow("Flashcard was not found.");
  });

  it("handles a malformed Flashcard id through controlled repository behavior", async () => {
    const study = createStudyService(
      createDrizzleStudyRepository(drizzle(client)),
    );

    await expect(
      study.recordResult({
        id: crypto.randomUUID(),
        deckId,
        flashcardId: "not-a-uuid",
        assessment: "correct",
      }),
    ).rejects.toThrow("Flashcard was not found.");
  });

  it("retains a Correct result and its updated Recall Streak", async () => {
    const database = drizzle(client);
    const flashcards = createFlashcardService(
      createDrizzleFlashcardRepository(database),
    );
    const created = await flashcards.create({
      deckId,
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
    });
    const study = createStudyService(createDrizzleStudyRepository(database));

    const result = await study.recordResult({
      id: crypto.randomUUID(),
      deckId,
      flashcardId: created.id,
      assessment: "correct",
    });
    const { recallStreak, ...studyResult } = result;

    expect(recallStreak).toBe(1);
    expect(await study.history()).toEqual([studyResult]);
    expect(await flashcards.get(deckId, created.id)).toMatchObject({
      recallStreak: 1,
    });
  });

  it("provides every saved Flashcard to a study session", async () => {
    const database = drizzle(client);
    const flashcards = createFlashcardService(
      createDrizzleFlashcardRepository(database),
    );
    const first = await flashcards.create({ deckId, front: "høflig", back: "polite" });
    const second = await flashcards.create({ deckId, front: "ledig", back: "available" });
    const study = createStudyService(createDrizzleStudyRepository(database));

    expect(await study.cards(deckId)).toEqual(
      expect.arrayContaining([first, second]),
    );
    expect(await study.cards(deckId)).toHaveLength(2);
  });

  it("resets a persisted Recall Streak after an Incorrect result", async () => {
    const database = drizzle(client);
    const flashcards = createFlashcardService(
      createDrizzleFlashcardRepository(database),
    );
    const created = await flashcards.create({
      deckId,
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
    });
    const firstSession = createStudyService(
      createDrizzleStudyRepository(database),
    );
    await firstSession.recordResult({
      id: crypto.randomUUID(),
      deckId,
      flashcardId: created.id,
      assessment: "correct",
    });
    await firstSession.recordResult({
      id: crypto.randomUUID(),
      deckId,
      flashcardId: created.id,
      assessment: "correct",
    });

    const anotherDevice = createStudyService(
      createDrizzleStudyRepository(drizzle(client)),
    );
    await anotherDevice.recordResult({
      id: crypto.randomUUID(),
      deckId,
      flashcardId: created.id,
      assessment: "incorrect",
    });

    expect(await flashcards.get(deckId, created.id)).toMatchObject({
      recallStreak: 0,
    });
    expect(await anotherDevice.history()).toHaveLength(3);
  });

  it("does not advance the streak twice for a repeated attempt", async () => {
    const database = drizzle(client);
    const flashcards = createFlashcardService(
      createDrizzleFlashcardRepository(database),
    );
    const created = await flashcards.create({
      deckId,
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
    });
    const study = createStudyService(createDrizzleStudyRepository(database));
    const attempt = {
      id: crypto.randomUUID(),
      deckId,
      flashcardId: created.id,
      assessment: "correct" as const,
    };

    const first = await study.recordResult(attempt);
    const repeated = await study.recordResult(attempt);
    const { recallStreak, ...studyResult } = first;

    expect(repeated).toEqual(first);
    expect(recallStreak).toBe(1);
    expect(await study.history()).toEqual([studyResult]);
    expect(await flashcards.get(deckId, created.id)).toMatchObject({
      recallStreak: 1,
    });
  });

  it("preserves Recall Streak when Flashcard content is edited", async () => {
    const database = drizzle(client);
    const flashcards = createFlashcardService(
      createDrizzleFlashcardRepository(database),
    );
    const created = await flashcards.create({
      deckId,
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
    });
    const study = createStudyService(createDrizzleStudyRepository(database));
    await study.recordResult({
      id: crypto.randomUUID(),
      deckId,
      flashcardId: created.id,
      assessment: "correct",
    });

    const updated = await flashcards.update(deckId, created.id, {
      front: "Jeg kjører taxi.",
      back: "I drive a cab.",
    });

    expect(updated).toMatchObject({
      front: "Jeg kjører taxi.",
      back: "I drive a cab.",
      recallStreak: 1,
    });
  });

  it("rolls back the Study Result when the streak update fails", async () => {
    const database = drizzle(client);
    const flashcards = createFlashcardService(
      createDrizzleFlashcardRepository(database),
    );
    const created = await flashcards.create({
      deckId,
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
    });
    const study = createStudyService(createDrizzleStudyRepository(database));
    await client.exec(`
      create function reject_recall_streak_update() returns trigger as $$
      begin
        raise exception 'streak update rejected';
      end;
      $$ language plpgsql;

      create trigger reject_recall_streak_update
      before update of recall_streak on flashcards
      for each row execute function reject_recall_streak_update();
    `);

    await expect(
      study.recordResult({
        id: crypto.randomUUID(),
        deckId,
        flashcardId: created.id,
        assessment: "correct",
      }),
    ).rejects.toThrow();

    expect(await study.history()).toEqual([]);
    expect(await flashcards.get(deckId, created.id)).toMatchObject({
      recallStreak: 0,
    });
  });

  it("retains Study Result history after its Flashcard is deleted", async () => {
    const database = drizzle(client);
    const flashcards = createFlashcardService(
      createDrizzleFlashcardRepository(database),
    );
    const created = await flashcards.create({
      deckId,
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
    });
    const study = createStudyService(createDrizzleStudyRepository(database));
    const result = await study.recordResult({
      id: crypto.randomUUID(),
      deckId,
      flashcardId: created.id,
      assessment: "correct",
    });

    await flashcards.delete(deckId, created.id);

    expect(await study.history()).toEqual([
      {
        id: result.id,
        flashcardId: null,
        assessment: result.assessment,
        createdAt: result.createdAt,
      },
    ]);
  });
});
