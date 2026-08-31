import { describe, expect, it } from "vitest";
import { createFlashcardService } from "../application/flashcards";
import { MemoryFlashcardRepository } from "../testing/memory-flashcard-repository";
import { submitEditFlashcardForm } from "./maintain-flashcard";

describe("Flashcard maintenance forms", () => {
  it("updates the addressed Flashcard with valid submitted content", async () => {
    const flashcards = createFlashcardService(
      new MemoryFlashcardRepository(),
    );
    const created = await flashcards.create({
      deckId: "deck-a",
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
    });
    const formData = new FormData();
    formData.set("front", "Jeg kjører taxi.");
    formData.set("back", "I drive a cab.");

    expect(
      await submitEditFlashcardForm(flashcards, "deck-a", created.id, formData),
    ).toEqual({ status: "updated" });
    expect(await flashcards.get("deck-a", created.id)).toMatchObject({
      front: "Jeg kjører taxi.",
      back: "I drive a cab.",
    });
  });

  it("returns invalid submitted content without changing the Flashcard", async () => {
    const flashcards = createFlashcardService(
      new MemoryFlashcardRepository(),
    );
    const created = await flashcards.create({
      deckId: "deck-a",
      front: "Jeg kjører drosje.",
      back: "I drive a taxi.",
    });
    const formData = new FormData();
    formData.set("front", "   ");
    formData.set("back", "I drive a cab.");

    expect(
      await submitEditFlashcardForm(flashcards, "deck-a", created.id, formData),
    ).toEqual({
      status: "invalid",
      fieldErrors: { front: "Enter a Norwegian Front." },
      values: { front: "   ", back: "I drive a cab." },
    });
    expect(await flashcards.get("deck-a", created.id)).toEqual(created);
  });
});
