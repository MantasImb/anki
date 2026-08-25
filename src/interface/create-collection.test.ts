import { describe, expect, it } from "vitest";
import { createCollectionService } from "../application/collections";
import { MemoryCollectionRepository } from "../testing/memory-collection-repository";
import { submitCreateCollectionForm } from "./create-collection";

describe("Create collection form submission", () => {
  it("returns a Deck name error without changing the collection", async () => {
    const decks = createCollectionService(
      "Flashcard Deck",
      new MemoryCollectionRepository(),
    );
    const formData = new FormData();
    formData.set("name", " \n ");

    expect(
      await submitCreateCollectionForm(decks, "Flashcard Deck", formData),
    ).toEqual({
      status: "invalid",
      fieldErrors: { name: "Enter a Flashcard Deck name." },
      values: { name: " \n " },
    });
    expect(await decks.list()).toEqual([]);
  });
});
