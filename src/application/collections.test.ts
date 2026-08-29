import { describe, expect, it, vi } from "vitest";
import { createCollectionService } from "./collections";
import { MemoryCollectionRepository } from "../testing/memory-collection-repository";

describe("Flashcard Deck collections", () => {
  it("creates and retrieves an empty Flashcard Deck", async () => {
    const decks = createCollectionService(
      "Flashcard Deck",
      new MemoryCollectionRepository(),
    );

    const created = await decks.create({ name: "På vei" });

    expect(await decks.list()).toEqual([created]);
    expect(await decks.get(created.id)).toEqual(created);
  });

  it("trims and collapses whitespace in the displayed Collection Name", async () => {
    const decks = createCollectionService(
      "Flashcard Deck",
      new MemoryCollectionRepository(),
    );

    const created = await decks.create({ name: "  På\n  vei  " });

    expect(created.name).toBe("På vei");
  });

  it("rejects a blank Collection Name without creating a Deck", async () => {
    const decks = createCollectionService(
      "Flashcard Deck",
      new MemoryCollectionRepository(),
    );

    await expect(decks.create({ name: " \n " })).rejects.toMatchObject({
      name: "CollectionNameValidationError",
      fieldErrors: { name: "Enter a Flashcard Deck name." },
    });
    expect(await decks.list()).toEqual([]);
  });

  it("rejects case- and whitespace-equivalent Deck names", async () => {
    const decks = createCollectionService(
      "Flashcard Deck",
      new MemoryCollectionRepository(),
    );
    await decks.create({ name: "På vei" });

    await expect(decks.create({ name: "  PÅ   VEI " })).rejects.toMatchObject({
      name: "CollectionNameConflictError",
      fieldErrors: { name: "A Flashcard Deck with this name already exists." },
    });
    expect(await decks.list()).toHaveLength(1);
  });

  it("permanently removes a Deck and reports repeated deletion", async () => {
    const decks = createCollectionService(
      "Flashcard Deck",
      new MemoryCollectionRepository(),
    );
    const deck = await decks.create({ name: "På vei" });

    await decks.delete(deck.id);

    expect(await decks.get(deck.id)).toBeUndefined();
    await expect(decks.delete(deck.id)).rejects.toMatchObject({
      name: "CollectionNotFoundError",
    });
  });

  it("keeps a successful deletion when best-effort cleanup fails", async () => {
    const repository = new MemoryCollectionRepository();
    const cleanup = vi.fn(async () => {
      throw new Error("bucket unavailable");
    });
    const quizzes = createCollectionService("Quiz", repository, cleanup);
    const quiz = await quizzes.create({ name: "Bilder" });

    await expect(quizzes.delete(quiz.id)).resolves.toBeUndefined();
    expect(await quizzes.get(quiz.id)).toBeUndefined();
    expect(cleanup).toHaveBeenCalledOnce();
  });
});

describe("independent collection types", () => {
  it("allows a Flashcard Deck and Quiz to share a normalized name", async () => {
    const decks = createCollectionService(
      "Flashcard Deck",
      new MemoryCollectionRepository(),
    );
    const quizzes = createCollectionService(
      "Quiz",
      new MemoryCollectionRepository(),
    );

    await decks.create({ name: "På vei" });
    await quizzes.create({ name: "  PÅ   VEI " });

    expect((await decks.list()).map(({ name }) => name)).toEqual(["På vei"]);
    expect((await quizzes.list()).map(({ name }) => name)).toEqual(["PÅ VEI"]);
  });

  it("keeps Norwegian letters and punctuation significant", async () => {
    const quizzes = createCollectionService(
      "Quiz",
      new MemoryCollectionRepository(),
    );

    await quizzes.create({ name: "Blåbær?" });
    await quizzes.create({ name: "Blabær?" });
    await quizzes.create({ name: "Blåbær!" });

    expect(await quizzes.list()).toHaveLength(3);
  });
});
