import type { Flashcard, FlashcardContent } from "./flashcards";
import type { CardDraft } from "./generation";

export type DraftApproval = {
  draft: CardDraft;
  flashcard: Flashcard;
};

export interface CardDraftReviewRepository {
  updatePending(
    deckId: string,
    sourceTextId: string,
    id: string,
    input: FlashcardContent,
  ): Promise<CardDraft | undefined>;
  approve(
    deckId: string,
    sourceTextId: string,
    id: string,
    input: FlashcardContent,
  ): Promise<DraftApproval | undefined>;
  approveRemaining(deckId: string, sourceTextId: string): Promise<DraftApproval[]>;
  reject(
    deckId: string,
    sourceTextId: string,
    id: string,
  ): Promise<CardDraft | undefined>;
}

export class CardDraftUnavailableError extends Error {
  constructor() {
    super("Card Draft is no longer available for review.");
    this.name = "CardDraftUnavailableError";
  }
}

export class CardDraftValidationError extends Error {
  constructor(
    readonly fieldErrors: Partial<Record<keyof FlashcardContent, string>>,
  ) {
    super("Card Draft content is invalid.");
    this.name = "CardDraftValidationError";
  }
}

function validateDraft(input: FlashcardContent) {
  const fieldErrors: Partial<Record<keyof FlashcardContent, string>> = {};

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
    async update(
      deckId: string,
      sourceTextId: string,
      id: string,
      input: FlashcardContent,
    ) {
      validateDraft(input);
      const updated = await repository.updatePending(
        deckId,
        sourceTextId,
        id,
        input,
      );

      if (!updated) {
        throw new CardDraftUnavailableError();
      }

      return updated;
    },
    async approve(
      deckId: string,
      sourceTextId: string,
      id: string,
      input: FlashcardContent,
    ) {
      validateDraft(input);
      const approval = await repository.approve(deckId, sourceTextId, id, input);

      if (!approval) {
        throw new CardDraftUnavailableError();
      }

      return approval;
    },
    approveRemaining(deckId: string, sourceTextId: string) {
      return repository.approveRemaining(deckId, sourceTextId);
    },
    async reject(deckId: string, sourceTextId: string, id: string) {
      const rejected = await repository.reject(deckId, sourceTextId, id);

      if (!rejected) {
        throw new CardDraftUnavailableError();
      }

      return rejected;
    },
  };
}
