// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PrimaryNavigation } from "./primary-navigation";

afterEach(cleanup);

describe("top-level navigation", () => {
  it("offers distinct Flashcard Deck and Quiz destinations", () => {
    render(<PrimaryNavigation />);

    expect(
      screen.getByRole("link", { name: "Flashcard Decks" }).getAttribute("href"),
    ).toBe("/decks");
    expect(screen.getByRole("link", { name: "Quizzes" }).getAttribute("href"))
      .toBe("/quizzes");
  });
});
