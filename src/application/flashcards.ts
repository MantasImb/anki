export type NewFlashcard = {
  front: string;
  back: string;
};

export type Flashcard = NewFlashcard & {
  id: string;
  recallStreak: number;
  sourceTextId?: string | null;
};

export interface FlashcardRepository {
  create(input: NewFlashcard): Promise<Flashcard>;
  delete(id: string): Promise<boolean>;
  get(id: string): Promise<Flashcard | undefined>;
  list(): Promise<Flashcard[]>;
  update(id: string, input: NewFlashcard): Promise<Flashcard | undefined>;
}

export class FlashcardNotFoundError extends Error {
  constructor() {
    super("Flashcard was not found.");
    this.name = "FlashcardNotFoundError";
  }
}

export class FlashcardValidationError extends Error {
  constructor(
    readonly fieldErrors: Partial<Record<keyof NewFlashcard, string>>,
  ) {
    super("Flashcard content is invalid.");
    this.name = "FlashcardValidationError";
  }
}

function validateFlashcard(input: NewFlashcard) {
  const fieldErrors: Partial<Record<keyof NewFlashcard, string>> = {};

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
    async delete(id: string) {
      const deleted = await repository.delete(id);

      if (!deleted) {
        throw new FlashcardNotFoundError();
      }
    },
    get(id: string) {
      return repository.get(id);
    },
    list() {
      return repository.list();
    },
    async update(id: string, input: NewFlashcard) {
      validateFlashcard(input);
      const updated = await repository.update(id, input);

      if (!updated) {
        throw new FlashcardNotFoundError();
      }

      return updated;
    },
  };
}
