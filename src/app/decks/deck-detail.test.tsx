// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DeckDetail } from "./deck-detail";

afterEach(cleanup);

const deleteAction = async () => ({ status: "idle" as const });

describe("Flashcard Deck detail", () => {
  it("shows an empty state without Deck Progress", () => {
    render(
      <DeckDetail
        deck={{ id: "deck-a", name: "På vei" }}
        deleteAction={deleteAction}
        flashcards={[]}
      />,
    );

    expect(screen.getByRole("heading", { name: "No cards yet" })).toBeTruthy();
    expect(screen.queryByText(/Deck Progress/)).toBeNull();
  });

  it("lists only the selected Deck's Flashcards with Deck-scoped actions", () => {
    render(
      <DeckDetail
        deck={{ id: "deck-a", name: "På vei" }}
        deleteAction={deleteAction}
        flashcards={[
          {
            id: "card-a",
            deckId: "deck-a",
            front: "høflig",
            back: "polite",
            recallStreak: 0,
          },
        ]}
      />,
    );

    expect(screen.getByText("høflig")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Add Flashcard" }).getAttribute("href"))
      .toBe("/decks/deck-a/cards/new");
    expect(
      screen.getByRole("link", { name: "Generate Flashcards" }).getAttribute("href"),
    ).toBe("/decks/deck-a/generate");
    expect(screen.getByRole("link", { name: "Edit Flashcard" }).getAttribute("href"))
      .toBe("/decks/deck-a/cards/card-a/edit");
    expect(screen.getByRole("link", { name: "Study Deck" }).getAttribute("href"))
      .toBe("/decks/deck-a/study");
  });

  it("shows Deck Progress and each Flashcard's Recall Streak", () => {
    render(
      <DeckDetail
        deck={{ id: "deck-a", name: "På vei" }}
        deleteAction={deleteAction}
        flashcards={[
          {
            id: "card-a",
            deckId: "deck-a",
            front: "høflig",
            back: "polite",
            recallStreak: 0,
          },
          {
            id: "card-b",
            deckId: "deck-a",
            front: "ledig",
            back: "available",
            recallStreak: 3,
          },
        ]}
      />,
    );

    expect(screen.getByText("Deck Progress: 50% Learned")).toBeTruthy();
    expect(screen.getByText("Recall streak 0/3")).toBeTruthy();
    expect(screen.getByText("Recall streak 3/3")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Study Deck" })).toBeTruthy();
  });

  it("keeps a fully Learned Deck available for study", () => {
    render(
      <DeckDetail
        deck={{ id: "deck-a", name: "På vei" }}
        deleteAction={deleteAction}
        flashcards={[
          {
            id: "card-a",
            deckId: "deck-a",
            front: "høflig",
            back: "polite",
            recallStreak: 3,
          },
        ]}
      />,
    );

    expect(screen.getByText("Deck Progress: 100% Learned")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Study Deck" }).getAttribute("href"))
      .toBe("/decks/deck-a/study");
  });
});
