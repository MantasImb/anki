// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DraftReview } from "./draft-review";

afterEach(cleanup);

describe("Card Draft review", () => {
  it("shows every generated pair as pending for review", () => {
    render(
      <DraftReview
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

    expect(screen.getByRole("heading", { name: "2 Card Drafts" })).toBeTruthy();
    expect(screen.getAllByText("Pending review")).toHaveLength(2);
    expect(screen.getByText("høflig")).toBeTruthy();
    expect(screen.getByText("polite")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /approve/i })).toBeNull();
  });
});
