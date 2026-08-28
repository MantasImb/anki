export type FlashcardContent = {
  front: string;
  back: string;
};

export type NewFlashcard = FlashcardContent & {
  deckId: string;
};

export type Flashcard = NewFlashcard & {
  id: string;
  recallStreak: number;
  sourceTextId?: string | null;
};

export interface FlashcardRepository {
  create(input: NewFlashcard): Promise<Flashcard>;
  delete(deckId: string, id: string): Promise<boolean>;
  get(deckId: string, id: string): Promise<Flashcard | undefined>;
  list(deckId: string): Promise<Flashcard[]>;
  update(
    deckId: string,
    id: string,
    input: FlashcardContent,
  ): Promise<Flashcard | undefined>;
}

export class FlashcardNotFoundError extends Error {
  constructor() {
    super("Flashcard was not found.");
    this.name = "FlashcardNotFoundError";
  }
}

export class FlashcardValidationError extends Error {
  constructor(
    readonly fieldErrors: Partial<Record<keyof FlashcardContent, string>>,
  ) {
    super("Flashcard content is invalid.");
    this.name = "FlashcardValidationError";
  }
}

export function calculateDeckProgress(flashcards: Flashcard[]) {
  const learned = flashcards.filter(
    ({ recallStreak }) => recallStreak === 3,
  ).length;
  return {
    learned,
    total: flashcards.length,
    percentage:
      flashcards.length === 0
        ? 0
        : Math.round((learned / flashcards.length) * 100),
  };
}

function validateFlashcard(input: FlashcardContent) {
  const fieldErrors: Partial<Record<keyof FlashcardContent, string>> = {};

  if (!input.front.trim()) {
    fieldErrors.front = "Enter a Norwegian Front.";
  }

  if (!input.back.trim()) {
    fieldErrors.back = "Enter an English Back.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new FlashcardValidationError(fieldErrors);
  }
}

export function createFlashcardService(repository: FlashcardRepository) {
  return {
    async create(input: NewFlashcard) {
      validateFlashcard(input);
      return repository.create(input);
    },
    async delete(deckId: string, id: string) {
      const deleted = await repository.delete(deckId, id);

      if (!deleted) {
        throw new FlashcardNotFoundError();
      }
    },
    get(deckId: string, id: string) {
      return repository.get(deckId, id);
    },
    list(deckId: string) {
      return repository.list(deckId);
    },
    async update(deckId: string, id: string, input: FlashcardContent) {
      validateFlashcard(input);
      const updated = await repository.update(deckId, id, input);

      if (!updated) {
        throw new FlashcardNotFoundError();
      }

      return updated;
    },
  };
}
