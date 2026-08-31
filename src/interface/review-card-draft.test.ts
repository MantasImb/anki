import { describe, expect, it, vi } from "vitest";
import { submitCardDraftReview } from "./review-card-draft";

describe("Card Draft review form", () => {
  it("approves the currently submitted Front and Back", async () => {
    const reviews = {
      update: vi.fn(),
      approve: vi.fn().mockResolvedValue({}),
      reject: vi.fn(),
    };
    const formData = new FormData();
    formData.set("draftId", "draft-1");
    formData.set("intent", "approve");
    formData.set("front", "å opptre høflig");
    formData.set("back", "to behave politely");

    expect(await submitCardDraftReview(reviews, "deck-a", "source-1", formData)).toEqual({
      status: "approved",
    });
    expect(reviews.approve).toHaveBeenCalledWith("deck-a", "source-1", "draft-1", {
      front: "å opptre høflig",
      back: "to behave politely",
    });
  });
});
