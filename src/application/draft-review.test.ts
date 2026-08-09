import { describe, expect, it } from "vitest";
import type {
  CardDraftReviewRepository,
  DraftApproval,
} from "./draft-review";
import { createCardDraftReviewService } from "./draft-review";
import type { CardDraft } from "./generation";

class MemoryCardDraftReviewRepository implements CardDraftReviewRepository {
  readonly flashcards: DraftApproval["flashcard"][] = [];
  private approval: DraftApproval | undefined;

  constructor(private draft: CardDraft) {}

  async updatePending(
    sourceTextId: string,
    id: string,
    input: { front: string; back: string },
  ): Promise<CardDraft | undefined> {
    if (
      sourceTextId !== this.draft.sourceTextId ||
      id !== this.draft.id ||
      this.draft.reviewStatus !== "pending"
    ) {
      return undefined;
    }

    this.draft = { ...this.draft, ...input };
    return this.draft;
  }

  async approve(
    sourceTextId: string,
    id: string,
    input: { front: string; back: string },
  ): Promise<DraftApproval | undefined> {
    if (
      sourceTextId !== this.draft.sourceTextId ||
      id !== this.draft.id ||
      this.draft.reviewStatus === "rejected"
    ) {
      return undefined;
    }

    if (this.approval) {
      return this.approval;
    }

    const flashcard = {
      id: crypto.randomUUID(),
      ...input,
      recallStreak: 0,
      sourceTextId: this.draft.sourceTextId,
    };
    this.flashcards.push(flashcard);
    this.draft = {
      ...this.draft,
      ...input,
      reviewStatus: "approved",
      approvedFlashcardId: flashcard.id,
    };

    this.approval = { draft: this.draft, flashcard };
    return this.approval;
  }

  async approveRemaining(): Promise<DraftApproval[]> {
    return [];
  }

  async reject(
    sourceTextId: string,
    id: string,
  ): Promise<CardDraft | undefined> {
    if (
      sourceTextId !== this.draft.sourceTextId ||
      id !== this.draft.id ||
      this.draft.reviewStatus === "approved"
    ) {
      return undefined;
    }

    this.draft = { ...this.draft, reviewStatus: "rejected" };
    return this.draft;
  }
}

describe("Card Draft review", () => {
  it("approves the currently reviewed content into one studyable Flashcard", async () => {
    const repository = new MemoryCardDraftReviewRepository({
      id: "draft-1",
      sourceTextId: "source-1",
      front: "høflig",
      back: "polite",
      reviewStatus: "pending",
    });
    const reviews = createCardDraftReviewService(repository);

    const approval = await reviews.approve("source-1", "draft-1", {
      front: "å opptre høflig",
      back: "to behave politely",
    });

    expect(approval).toMatchObject({
      draft: {
        front: "å opptre høflig",
        back: "to behave politely",
        reviewStatus: "approved",
      },
      flashcard: {
        front: "å opptre høflig",
        back: "to behave politely",
        recallStreak: 0,
        sourceTextId: "source-1",
      },
    });
    expect(repository.flashcards).toHaveLength(1);
  });

  it("returns the original approval when approval is submitted again", async () => {
    const repository = new MemoryCardDraftReviewRepository({
      id: "draft-1",
      sourceTextId: "source-1",
      front: "høflig",
      back: "polite",
      reviewStatus: "pending",
    });
    const reviews = createCardDraftReviewService(repository);

    const first = await reviews.approve("source-1", "draft-1", {
      front: "høflig",
      back: "polite",
    });
    const repeated = await reviews.approve("source-1", "draft-1", {
      front: "høflig",
      back: "polite",
    });

    expect(repeated).toEqual(first);
    expect(repository.flashcards).toHaveLength(1);
  });

  it("saves corrected content while keeping the Card Draft pending", async () => {
    const repository = new MemoryCardDraftReviewRepository({
      id: "draft-1",
      sourceTextId: "source-1",
      front: "høflig",
      back: "polite",
      reviewStatus: "pending",
    });
    const reviews = createCardDraftReviewService(repository);

    const updated = await reviews.update("source-1", "draft-1", {
      front: "å opptre høflig",
      back: "to behave politely",
    });

    expect(updated).toMatchObject({
      front: "å opptre høflig",
      back: "to behave politely",
      reviewStatus: "pending",
    });
  });

  it("rejects a pending Card Draft without creating a Flashcard", async () => {
    const repository = new MemoryCardDraftReviewRepository({
      id: "draft-1",
      sourceTextId: "source-1",
      front: "høflig",
      back: "polite",
      reviewStatus: "pending",
    });
    const reviews = createCardDraftReviewService(repository);

    const rejected = await reviews.reject("source-1", "draft-1");

    expect(rejected.reviewStatus).toBe("rejected");
    expect(repository.flashcards).toEqual([]);
  });
});
