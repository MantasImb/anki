import type { Flashcard, NewFlashcard } from "./flashcards";
import type { CardDraft } from "./generation";

export type DraftApproval = {
  draft: CardDraft;
  flashcard: Flashcard;
};

export interface CardDraftReviewRepository {
  updatePending(
    sourceTextId: string,
    id: string,
    input: NewFlashcard,
  ): Promise<CardDraft | undefined>;
  approve(
    sourceTextId: string,
    id: string,
    input: NewFlashcard,
  ): Promise<DraftApproval | undefined>;
  approveRemaining(sourceTextId: string): Promise<DraftApproval[]>;
  reject(sourceTextId: string, id: string): Promise<CardDraft | undefined>;
}

export class CardDraftUnavailableError extends Error {
  constructor() {
    super("Card Draft is no longer available for review.");
    this.name = "CardDraftUnavailableError";
  }
}

export class CardDraftValidationError extends Error {
  constructor(
    readonly fieldErrors: Partial<Record<keyof NewFlashcard, string>>,
  ) {
    super("Card Draft content is invalid.");
    this.name = "CardDraftValidationError";
  }
}

function validateDraft(input: NewFlashcard) {
  const fieldErrors: Partial<Record<keyof NewFlashcard, string>> = {};

  if (!input.front.trim()) {
    fieldErrors.front = "Enter a Norwegian Front.";
  }

  if (!input.back.trim()) {
    fieldErrors.back = "Enter an English Back.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new CardDraftValidationError(fieldErrors);
  }
}

export function createCardDraftReviewService(
  repository: CardDraftReviewRepository,
) {
  return {
    async update(sourceTextId: string, id: string, input: NewFlashcard) {
      validateDraft(input);
      const updated = await repository.updatePending(sourceTextId, id, input);

      if (!updated) {
        throw new CardDraftUnavailableError();
      }

      return updated;
    },
    async approve(sourceTextId: string, id: string, input: NewFlashcard) {
      validateDraft(input);
      const approval = await repository.approve(sourceTextId, id, input);

      if (!approval) {
        throw new CardDraftUnavailableError();
      }

      return approval;
    },
    approveRemaining(sourceTextId: string) {
      return repository.approveRemaining(sourceTextId);
    },
    async reject(sourceTextId: string, id: string) {
      const rejected = await repository.reject(sourceTextId, id);

      if (!rejected) {
        throw new CardDraftUnavailableError();
      }

      return rejected;
    },
  };
}
