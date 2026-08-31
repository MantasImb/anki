import { describe, expect, it } from "vitest";
import { createFlashcardService } from "../application/flashcards";
import { MemoryFlashcardRepository } from "../testing/memory-flashcard-repository";
import { submitAddFlashcardForm } from "./add-flashcard";

describe("Add Flashcard form submission", () => {
  it("adds the Flashcard to the selected Deck", async () => {
    const flashcards = createFlashcardService(
      new MemoryFlashcardRepository(),
    );
    const formData = new FormData();
    formData.set("front", "Jeg kjører drosje.");
    formData.set("back", "I drive a taxi.");

    expect(
      await submitAddFlashcardForm(flashcards, "deck-a", formData),
    ).toEqual({ status: "created" });
    expect(await flashcards.list("deck-a")).toMatchObject([
      { deckId: "deck-a", front: "Jeg kjører drosje." },
    ]);
  });

  it("returns both field errors without changing the collection", async () => {
    const flashcards = createFlashcardService(
      new MemoryFlashcardRepository(),
    );
    const formData = new FormData();
    formData.set("front", " ");
    formData.set("back", "");

    expect(await submitAddFlashcardForm(flashcards, "deck-a", formData)).toEqual({
      status: "invalid",
      fieldErrors: {
        front: "Enter a Norwegian Front.",
        back: "Enter an English Back.",
      },
      values: { front: " ", back: "" },
    });
    expect(await flashcards.list("deck-a")).toEqual([]);
  });

  it("rejects a file submitted in place of text", async () => {
    const flashcards = createFlashcardService(
      new MemoryFlashcardRepository(),
    );
    const formData = new FormData();
    formData.set("front", new File(["Hei"], "front.txt"));
    formData.set("back", "Hello");

    expect(await submitAddFlashcardForm(flashcards, "deck-a", formData)).toMatchObject({
      status: "invalid",
      fieldErrors: { front: "Enter a Norwegian Front." },
    });
    expect(await flashcards.list("deck-a")).toEqual([]);
  });
});
