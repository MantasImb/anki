// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FlashcardList } from "./flashcard-list";

afterEach(cleanup);

describe("Flashcard collection", () => {
  it("offers an edit destination for every saved Flashcard", () => {
    render(
      <FlashcardList
        deckId="deck-id"
        flashcards={[
          {
            id: "card-id",
            deckId: "deck-id",
            front: "Jeg kjører drosje.",
            back: "I drive a taxi.",
            recallStreak: 0,
          },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "Edit Flashcard" }).getAttribute("href"))
      .toBe("/decks/deck-id/cards/card-id/edit");
    expect(screen.getByText("Recall streak 0/3")).toBeTruthy();
  });
});
