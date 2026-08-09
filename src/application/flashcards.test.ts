import { describe, expect, it } from "vitest";
import { MemoryFlashcardRepository } from "../testing/memory-flashcard-repository";
import { createFlashcardService } from "./flashcards";

describe("manual Flashcard creation", () => {
  it("creates exactly one immediately studyable Flashcard", async () => {
    const flashcards = createFlashcardService(
      new MemoryFlashcardRepository(),
    );

    const created = await flashcards.create({
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
    });

    expect(await flashcards.list()).toEqual([created]);
    expect(created.recallStreak).toBe(0);
  });

  it("rejects a blank Front without changing the collection", async () => {
    const flashcards = createFlashcardService(
      new MemoryFlashcardRepository(),
    );

    await expect(
      flashcards.create({ front: "   ", back: "I drive a taxi." }),
    ).rejects.toMatchObject({
      fieldErrors: { front: "Enter a Norwegian Front." },
    });
    expect(await flashcards.list()).toEqual([]);
  });

  it("rejects a blank Back without changing the collection", async () => {
    const flashcards = createFlashcardService(
      new MemoryFlashcardRepository(),
    );

    await expect(
      flashcards.create({ front: "Jeg kjører drosje.", back: "\n" }),
    ).rejects.toMatchObject({
      fieldErrors: { back: "Enter an English Back." },
    });
    expect(await flashcards.list()).toEqual([]);
  });
});

describe("Flashcard maintenance", () => {
  it("returns the saved Flashcard for editing", async () => {
    const flashcards = createFlashcardService(
      new MemoryFlashcardRepository(),
    );
    const created = await flashcards.create({
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
    });

    expect(await flashcards.get(created.id)).toEqual(created);
  });

  it("updates the existing Flashcard instead of creating another", async () => {
    const flashcards = createFlashcardService(
      new MemoryFlashcardRepository(),
    );
    const created = await flashcards.create({
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
    });

    const updated = await flashcards.update(created.id, {
      front: "Jeg kjører taxi.",
      back: "I drive a cab.",
    });

    expect(updated).toEqual({
      ...created,
      front: "Jeg kjører taxi.",
      back: "I drive a cab.",
    });
    expect(await flashcards.list()).toEqual([updated]);
  });

  it("rejects invalid edits without changing the stored Flashcard", async () => {
    const flashcards = createFlashcardService(
      new MemoryFlashcardRepository(),
    );
    const created = await flashcards.create({
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
    });

    await expect(
      flashcards.update(created.id, { front: "\t", back: "I drive a cab." }),
    ).rejects.toMatchObject({
      fieldErrors: { front: "Enter a Norwegian Front." },
    });
    expect(await flashcards.list()).toEqual([created]);
  });

  it("deletes an unwanted Flashcard", async () => {
    const flashcards = createFlashcardService(
      new MemoryFlashcardRepository(),
    );
    const created = await flashcards.create({
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
    });

    await flashcards.delete(created.id);

    expect(await flashcards.list()).toEqual([]);
  });

  it("reports when an edited Flashcard no longer exists", async () => {
    const flashcards = createFlashcardService(
      new MemoryFlashcardRepository(),
    );

    await expect(
      flashcards.update("missing-card", {
        front: "Jeg kjører taxi.",
        back: "I drive a cab.",
      }),
    ).rejects.toMatchObject({ name: "FlashcardNotFoundError" });
  });

  it("reports when a deleted Flashcard no longer exists", async () => {
    const flashcards = createFlashcardService(
      new MemoryFlashcardRepository(),
    );

    await expect(flashcards.delete("missing-card")).rejects.toMatchObject({
      name: "FlashcardNotFoundError",
    });
  });
});
