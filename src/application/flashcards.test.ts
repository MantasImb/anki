import { describe, expect, it } from "vitest";
import { MemoryFlashcardRepository } from "../testing/memory-flashcard-repository";
import { calculateDeckProgress, createFlashcardService } from "./flashcards";

describe("Deck Progress", () => {
  it("counts only Flashcards at Recall Streak three as Learned", () => {
    expect(
      calculateDeckProgress([
        { id: "a", deckId: "deck-a", front: "a", back: "A", recallStreak: 3 },
        { id: "b", deckId: "deck-a", front: "b", back: "B", recallStreak: 2 },
      ]),
    ).toEqual({ learned: 1, total: 2, percentage: 50 });
  });
});

describe("manual Flashcard creation", () => {
  it("creates exactly one immediately studyable Flashcard", async () => {
    const flashcards = createFlashcardService(
      new MemoryFlashcardRepository(),
    );

    const created = await flashcards.create({
      deckId: "deck-a",
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
    });

    expect(await flashcards.list("deck-a")).toEqual([created]);
    expect(created.deckId).toBe("deck-a");
    expect(created.recallStreak).toBe(0);
  });

  it("lists only Flashcards owned by the selected Deck", async () => {
    const flashcards = createFlashcardService(
      new MemoryFlashcardRepository(),
    );
    const selected = await flashcards.create({
      deckId: "deck-a",
      front: "høflig",
      back: "polite",
    });
    await flashcards.create({
      deckId: "deck-b",
      front: "ledig",
      back: "available",
    });

    expect(await flashcards.list("deck-a")).toEqual([selected]);
  });

  it("rejects a blank Front without changing the collection", async () => {
    const flashcards = createFlashcardService(
      new MemoryFlashcardRepository(),
    );

    await expect(
      flashcards.create({ deckId: "deck-a", front: "   ", back: "I drive a taxi." }),
    ).rejects.toMatchObject({
      fieldErrors: { front: "Enter a Norwegian Front." },
    });
    expect(await flashcards.list("deck-a")).toEqual([]);
  });

  it("rejects a blank Back without changing the collection", async () => {
    const flashcards = createFlashcardService(
      new MemoryFlashcardRepository(),
    );

    await expect(
      flashcards.create({ deckId: "deck-a", front: "Jeg kjører drosje.", back: "\n" }),
    ).rejects.toMatchObject({
      fieldErrors: { back: "Enter an English Back." },
    });
    expect(await flashcards.list("deck-a")).toEqual([]);
  });
});

describe("Flashcard maintenance", () => {
  it("returns the saved Flashcard for editing", async () => {
    const flashcards = createFlashcardService(
      new MemoryFlashcardRepository(),
    );
    const created = await flashcards.create({
      deckId: "deck-a",
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
    });

    expect(await flashcards.get("deck-a", created.id)).toEqual(created);
  });

  it("updates the existing Flashcard instead of creating another", async () => {
    const flashcards = createFlashcardService(
      new MemoryFlashcardRepository(),
    );
    const created = await flashcards.create({
      deckId: "deck-a",
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
    });

    const updated = await flashcards.update("deck-a", created.id, {
      front: "Jeg kjører taxi.",
      back: "I drive a cab.",
    });

    expect(updated).toEqual({
      ...created,
      front: "Jeg kjører taxi.",
      back: "I drive a cab.",
    });
    expect(await flashcards.list("deck-a")).toEqual([updated]);
  });

  it("does not edit a Flashcard through a different Deck", async () => {
    const flashcards = createFlashcardService(
      new MemoryFlashcardRepository(),
    );
    const created = await flashcards.create({
      deckId: "deck-a",
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
    });

    await expect(
      flashcards.update("deck-b", created.id, {
        front: "Jeg kjører taxi.",
        back: "I drive a cab.",
      }),
    ).rejects.toMatchObject({ name: "FlashcardNotFoundError" });
    expect(await flashcards.get("deck-a", created.id)).toEqual(created);
  });

  it("rejects invalid edits without changing the stored Flashcard", async () => {
    const flashcards = createFlashcardService(
      new MemoryFlashcardRepository(),
    );
    const created = await flashcards.create({
      deckId: "deck-a",
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
    });

    await expect(
      flashcards.update("deck-a", created.id, { front: "\t", back: "I drive a cab." }),
    ).rejects.toMatchObject({
      fieldErrors: { front: "Enter a Norwegian Front." },
    });
    expect(await flashcards.list("deck-a")).toEqual([created]);
  });

  it("deletes an unwanted Flashcard", async () => {
    const flashcards = createFlashcardService(
      new MemoryFlashcardRepository(),
    );
    const created = await flashcards.create({
      deckId: "deck-a",
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
    });

    await flashcards.delete("deck-a", created.id);

    expect(await flashcards.list("deck-a")).toEqual([]);
  });

  it("reports when an edited Flashcard no longer exists", async () => {
    const flashcards = createFlashcardService(
      new MemoryFlashcardRepository(),
    );

    await expect(
      flashcards.update("deck-a", "missing-card", {
        front: "Jeg kjører taxi.",
        back: "I drive a cab.",
      }),
    ).rejects.toMatchObject({ name: "FlashcardNotFoundError" });
  });

  it("reports when a deleted Flashcard no longer exists", async () => {
    const flashcards = createFlashcardService(
      new MemoryFlashcardRepository(),
    );

    await expect(flashcards.delete("deck-a", "missing-card")).rejects.toMatchObject({
      name: "FlashcardNotFoundError",
    });
  });
});
