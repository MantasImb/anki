// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CollectionDetail } from "./collection-detail";
import { CollectionList } from "./collection-list";

afterEach(cleanup);

describe("collection views", () => {
  it("opens a saved Quiz from the Quiz list", () => {
    render(
      <CollectionList
        basePath="/quizzes"
        collections={[{ id: "quiz-id", name: "På vei" }]}
      />,
    );

    expect(screen.getByRole("link", { name: "På vei" }).getAttribute("href"))
      .toBe("/quizzes/quiz-id");
  });

  it("shows a truthful empty Deck with Deck-scoped entry points", () => {
    render(
      <CollectionDetail
        collection={{ id: "deck-id", name: "På vei" }}
        collectionType="Flashcard Deck"
      />,
    );

    expect(screen.getByRole("heading", { name: "No cards yet" })).toBeTruthy();
    expect(screen.queryByText(/learned/i)).toBeNull();
    expect(screen.getByRole("link", { name: "Add Flashcard" }).getAttribute("href"))
      .toBe("/decks/deck-id/cards/new");
    expect(screen.getByRole("link", { name: "Study Deck" }).getAttribute("href"))
      .toBe("/decks/deck-id/study");
  });

  it("shows a truthful empty Quiz with Quiz-scoped entry points", () => {
    render(
      <CollectionDetail
        collection={{ id: "quiz-id", name: "På vei" }}
        collectionType="Quiz"
      />,
    );

    expect(screen.getByRole("heading", { name: "No questions yet" })).toBeTruthy();
    expect(screen.queryByText(/learned/i)).toBeNull();
    expect(screen.getByRole("link", { name: "Add Question" }).getAttribute("href"))
      .toBe("/quizzes/quiz-id/questions/new");
    expect(screen.getByRole("link", { name: "Study Quiz" }).getAttribute("href"))
      .toBe("/quizzes/quiz-id/study");
  });
});
