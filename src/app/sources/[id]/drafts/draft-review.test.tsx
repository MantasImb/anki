// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import type { CardDraftReviewFormState } from "@/interface/review-card-draft";
import { DraftReview } from "./draft-review";

afterEach(cleanup);

describe("Card Draft review", () => {
  it("lets the Learner edit or remove drafts before adding all remaining cards", async () => {
    const review = async (): Promise<CardDraftReviewFormState> => ({
      status: "rejected",
    });
    const addRemaining = async () => {};
    render(
      <DraftReview
        action={review}
        addAction={addRemaining}
        source={{
          id: "source-1",
          content: "Drosjesjåføren skal opptre høflig.",
          generationStatus: "completed",
          drafts: [
            {
              id: "draft-1",
              sourceTextId: "source-1",
              front: "høflig",
              back: "polite",
              reviewStatus: "pending",
            },
            {
              id: "draft-2",
              sourceTextId: "source-1",
              front: "en drosjesjåfør",
              back: "a taxi driver",
              reviewStatus: "pending",
            },
          ],
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "2 Card Drafts ready to add" }),
    ).toBeTruthy();
    expect(screen.queryByText("Pending review")).toBeNull();
    const frontFields = screen.getAllByRole("textbox", {
      name: "Norwegian Front",
    });
    const backFields = screen.getAllByRole("textbox", {
      name: "English Back",
    });
    expect(frontFields).toHaveLength(2);
    expect(backFields).toHaveLength(2);
    expect(frontFields.every((field) => field.getAttribute("rows") === "1"))
      .toBe(true);
    expect(backFields.every((field) => field.getAttribute("rows") === "1"))
      .toBe(true);
    expect(
      [...frontFields, ...backFields].every((field) =>
        field.classList.contains("content-sized-textarea"),
      ),
    ).toBe(true);
    expect(screen.getAllByRole("button", { name: "Save edits" })).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
    expect(screen.getAllByRole("button", { name: "Remove" })).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "Add 2 Flashcards" }),
    ).toBeTruthy();
    expect(screen.getAllByRole("status")).toHaveLength(2);

    await userEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);
    expect((await screen.findByText("Card Draft removed.")).getAttribute("role"))
      .toBe("status");
  });

  it("shows a dedicated empty state after every draft has been handled", () => {
    render(
      <DraftReview
        action={async () => ({ status: "saved" })}
        addAction={async () => {}}
        source={{
          id: "source-1",
          content: "Drosjesjåføren skal opptre høflig.",
          generationStatus: "completed",
          drafts: [
            {
              id: "draft-1",
              sourceTextId: "source-1",
              front: "høflig",
              back: "polite",
              reviewStatus: "rejected",
            },
          ],
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "No Card Drafts remain" }),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Add .*Flashcard/ })).toBeNull();
    expect(screen.queryByText(/ready by default/)).toBeNull();
  });
});
