import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFlashcardService } from "../../../application/flashcards";
import { createStudyService } from "../../../application/study";
import { createDrizzleFlashcardRepository } from "./flashcard-repository";
import { createDrizzleStudyRepository } from "./study-repository";

describe("PostgreSQL study persistence", () => {
  let client: PGlite;

  beforeEach(async () => {
    client = await PGlite.create();
    await migrate(drizzle(client), { migrationsFolder: "drizzle" });
  });

  afterEach(async () => {
    await client.close();
  });

  it("retains a Correct result and its updated Recall Streak", async () => {
    const database = drizzle(client);
    const flashcards = createFlashcardService(
      createDrizzleFlashcardRepository(database),
    );
    const created = await flashcards.create({
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
    });
    const study = createStudyService(createDrizzleStudyRepository(database));

    const result = await study.recordResult({
      id: crypto.randomUUID(),
      flashcardId: created.id,
      assessment: "correct",
    });

    expect(await study.history()).toEqual([result]);
    expect(await flashcards.get(created.id)).toMatchObject({
      recallStreak: 1,
    });
  });

  it("advances through saved Flashcards and wraps to the first", async () => {
    const database = drizzle(client);
    const flashcards = createFlashcardService(
      createDrizzleFlashcardRepository(database),
    );
    await flashcards.create({ front: "høflig", back: "polite" });
    await flashcards.create({ front: "ledig", back: "available" });
    const study = createStudyService(createDrizzleStudyRepository(database));

    const first = await study.nextCard();
    const second = await study.nextCard(first?.id);
    const wrapped = await study.nextCard(second?.id);

    expect(second?.id).not.toBe(first?.id);
    expect(wrapped).toEqual(first);
  });

  it("resets a persisted Recall Streak after an Incorrect result", async () => {
    const database = drizzle(client);
    const flashcards = createFlashcardService(
      createDrizzleFlashcardRepository(database),
    );
    const created = await flashcards.create({
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
    });
    const firstSession = createStudyService(
      createDrizzleStudyRepository(database),
    );
    await firstSession.recordResult({
      id: crypto.randomUUID(),
      flashcardId: created.id,
      assessment: "correct",
    });
    await firstSession.recordResult({
      id: crypto.randomUUID(),
      flashcardId: created.id,
      assessment: "correct",
    });

    const anotherDevice = createStudyService(
      createDrizzleStudyRepository(drizzle(client)),
    );
    await anotherDevice.recordResult({
      id: crypto.randomUUID(),
      flashcardId: created.id,
      assessment: "incorrect",
    });

    expect(await flashcards.get(created.id)).toMatchObject({
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
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
    });
    const study = createStudyService(createDrizzleStudyRepository(database));
    const attempt = {
      id: crypto.randomUUID(),
      flashcardId: created.id,
      assessment: "correct" as const,
    };

    const first = await study.recordResult(attempt);
    const repeated = await study.recordResult(attempt);

    expect(repeated).toEqual(first);
    expect(await study.history()).toEqual([first]);
    expect(await flashcards.get(created.id)).toMatchObject({
      recallStreak: 1,
    });
  });

  it("rolls back the Study Result when the streak update fails", async () => {
    const database = drizzle(client);
    const flashcards = createFlashcardService(
      createDrizzleFlashcardRepository(database),
    );
    const created = await flashcards.create({
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
        flashcardId: created.id,
        assessment: "correct",
      }),
    ).rejects.toThrow();

    expect(await study.history()).toEqual([]);
    expect(await flashcards.get(created.id)).toMatchObject({
      recallStreak: 0,
    });
  });

  it("retains Study Result history after its Flashcard is deleted", async () => {
    const database = drizzle(client);
    const flashcards = createFlashcardService(
      createDrizzleFlashcardRepository(database),
    );
    const created = await flashcards.create({
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
    });
    const study = createStudyService(createDrizzleStudyRepository(database));
    const result = await study.recordResult({
      id: crypto.randomUUID(),
      flashcardId: created.id,
      assessment: "correct",
    });

    await flashcards.delete(created.id);

    expect(await study.history()).toEqual([
      { ...result, flashcardId: null },
    ]);
  });
});
